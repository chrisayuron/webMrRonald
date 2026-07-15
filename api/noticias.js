// /api/noticias.js
// Función serverless de Vercel. Se ejecuta solo en el servidor, nunca en el navegador,
// así que la API key de GNews nunca queda expuesta al público.
//
// Configuración requerida en Vercel:
// Project Settings -> Environment Variables -> agregar GNEWS_API_KEY con tu key real.
//
// Esta ruta queda disponible automáticamente en: https://tudominio.vercel.app/api/noticias

export default async function handler(req, res) {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "Falta configurar la variable de entorno GNEWS_API_KEY en Vercel."
        });
    }

    // Palabras clave del feed. Se pueden ajustar aquí sin tocar el frontend.
    //
    // - Los temas permitidos van agrupados con OR dentro de un paréntesis.
    // - Cada "AND NOT palabra" excluye ese tema aunque aparezca de forma incidental.
    // - "in=title" hace que la búsqueda solo mire el TÍTULO del artículo, no la
    //   descripción completa. Es lo que evita que una noticia de política que
    //   solo menciona "tecnología" de pasada se cuele en el feed.
    const temas = '(programación OR "lenguajes de programación" OR "inteligencia artificial" OR invento OR "nueva tecnología" OR innovación)';
    const exclusiones = 'AND NOT política AND NOT gobierno AND NOT elecciones AND NOT farándula AND NOT famoso AND NOT celebridad';
    const consulta = encodeURIComponent(`${temas} ${exclusiones}`);
    const url = `https://gnews.io/api/v4/search?q=${consulta}&lang=es&max=8&in=title&sortby=publishedAt&apikey=${apiKey}`;

    try {
        const respuestaGNews = await fetch(url);

        if (!respuestaGNews.ok) {
            const detalle = await respuestaGNews.text();
            return res.status(respuestaGNews.status).json({
                error: "GNews respondió con un error.",
                detalle
            });
        }

        const data = await respuestaGNews.json();

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
        return res.status(500).json({
            error: "No se pudo obtener el feed de noticias.",
            detalle: error.message
        });
    }
}