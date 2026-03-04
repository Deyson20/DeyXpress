const G_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwrMB5QKIrRkM5nHD7Hjq8_JSIEYq58Q984uTYsFevFodKrA8fC5PBxs7IC4byl0WPluQ/exec'; // Asegúrate de que sea la última versión

async function enviarAGoogleSheets(datos) {
    console.log("Intentando respaldar pedido...");
    
    try {
        // Usamos un método compatible con Google Apps Script
        await fetch(G_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'text/plain' 
            },
            body: JSON.stringify(datos)
        });
        console.log("✅ Envío enviado a la cola de Google");
    } catch (error) {
        console.error("❌ Error de red:", error);
    }
}