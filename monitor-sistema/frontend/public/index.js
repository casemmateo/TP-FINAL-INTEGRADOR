const socket = io('http://192.168.0.19:3000'); // Ajusta IP según tu red

socket.on('connect', () => {
  console.log('🟢 Conectado al servidor de monitoreo');
});

socket.on('disconnect', () => {
  console.log('🔴 Desconectado del servidor');
});

// Escuchar los datos del sistema
socket.on('datosSistema', (datos) => {
    // CPU
    document.getElementById('cpu').innerHTML = `
        <h3>CPU</h3>
        <span>Fabricante:</span> ${datos.cpu.fabricante} <br>
        <span>Modelo:</span> ${datos.cpu.modelo} <br>
        <span>Núcleos:</span> ${datos.cpu.nucleos} <br>
        <span>Temperatura:</span> ${datos.cpu.temperatura}
    `;

    // Memoria
    document.getElementById('memoria').innerHTML = `
        <h3>Memoria</h3>
        <span>Total:</span> ${datos.memoria.total} <br>
        <span>Libre:</span> ${datos.memoria.libre} <br>
        <span>Usado:</span> ${datos.memoria.usado}
    `;

    // Discos
    let discosHtml = `<h3>Discos</h3>`;
    if (datos.particiones.sda1) {
        discosHtml += `
            <strong>Raíz:</strong><br>
            <span>FS:</span> ${datos.particiones.sda1.filesystem}<br>
            <span>Tamaño:</span> ${datos.particiones.sda1.tamaño}<br>
            <span>Usado:</span> ${datos.particiones.sda1.usado}<br>
            <span>Libre:</span> ${datos.particiones.sda1.libre}<br>
            <span>Uso:</span> ${datos.particiones.sda1.usoPorcentaje}<br><br>
        `;
    }
    if (datos.particiones.sda5) {
        discosHtml += `
            <strong>Swap:</strong><br>
            <span>Tamaño:</span> ${datos.particiones.sda5.tamaño}<br>
            <span>Usado:</span> ${datos.particiones.sda5.usado}<br>
            <span>Libre:</span> ${datos.particiones.sda5.libre}<br>
            <span>Uso:</span> ${datos.particiones.sda5.usoPorcentaje}
        `;
    }
    document.getElementById('discos').innerHTML = discosHtml;

    // Red
    const redHtml = datos.red.map(iface => `
        <div style="margin-bottom: 10px;">
            <span>Interfaz:</span> ${iface.interfaz} <br>
            <span>IP:</span> ${iface.ip4} <br>
            <span>MAC:</span> ${iface.mac} <br>
            <span>Recibido:</span> ${iface.recibidoMB} MB <br>
            <span>Enviado:</span> ${iface.enviadoMB} MB
        </div>
    `).join('');
    document.getElementById('red').innerHTML = `<h3>Red</h3>${redHtml}`;
});
