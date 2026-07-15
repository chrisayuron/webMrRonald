// /api/noticias.js
// Función serverless de Vercel. Se ejecuta solo en el servidor, nunca en el navegador,
// así que la API key de GNews nunca queda expuesta al público.
//
// Configuración requerida en Vercel:
// Project Settings -> Environment Variables -> agregar GNEWS_API_KEY con tu key real.
//
// Esta ruta queda disponible automáticamente en: https://tudominio.vercel.app/api/noticias

// Palabras clave del feed. Se pueden ajustar aquí sin tocar el frontend.
//
// - Los temas permitidos van agrupados con OR dentro de un paréntesis.
// - Cada "AND NOT palabra" excluye ese tema aunque aparezca de forma incidental.
// - "in=title" hace que la búsqueda solo mire el TÍTULO del artículo, no toda
//   la descripción. Es lo que evita que una noticia de política que solo
//   menciona "tecnología" de pasada se cuele en el feed.
// GNews limita el parámetro "q" a 200 caracteres, así que se mantiene compacto.
const TEMAS = '(programación OR "inteligencia artificial" OR invento OR "nueva tecnología")';
const EXCLUSIONES = 'AND NOT política AND NOT gobierno AND NOT elecciones AND NOT farándula AND NOT famoso';

function construirUrl(apiKey, { country } = {}) {
    const consulta = encodeURIComponent(`${TEMAS} ${EXCLUSIONES}`);
    let url = `https://gnews.io/api/v4/search?q=${consulta}&lang=es&max=8&in=title&sortby=publishedAt&apikey=${apiKey}`;
    if (country) url += `&country=${country}`;
    return url;
}

async function consultarGNews(url) {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        const error = new Error("GNews respondió con un error.");
        error.status = respuesta.status;
        error.detalle = detalle;
        throw error;
    }
    return respuesta.json();
}

export default async function handler(req, res) {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "Falta configurar la variable de entorno GNEWS_API_KEY en Vercel."
        });
    }

    try {
        // 1. Primero se prueba solo con fuentes colombianas.
        let data = await consultarGNews(construirUrl(apiKey, { country: "co" }));

        // 2. Colombia tiene pocas fuentes de tecnología indexadas en GNews en
        //    comparación con países como Argentina o España, así que si el
        //    resultado es escaso, se amplía a fuentes en español de cualquier país.
        if (!data.articles || data.articles.length < 4) {
            data = await consultarGNews(construirUrl(apiKey));
        }

        const noticias = (data.articles || []).map(articulo => ({
            titulo: articulo.title,
            descripcion: articulo.description,
            link: articulo.url,
            imagenUrl: articulo.image || "",
            fuente: articulo.source?.name || "",
            fecha: articulo.publishedAt
        }));

        // Cache a nivel de CDN de Vercel: reutiliza la misma respuesta durante 1 hora
        // para no gastar las 100 consultas/día del plan gratuito de GNews.
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
        return res.status(200).json({ noticias });

    } catch (error) {
        return res.status(error.status || 500).json({
            error: error.message || "No se pudo obtener el feed de noticias.",
            detalle: error.detalle
        });
    }
}