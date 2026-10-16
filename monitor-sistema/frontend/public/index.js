// Navegación entre las secciones.
const botones = document.querySelectorAll('[data-seccion]');
const paneles = document.querySelectorAll('[data-panel]');
const tituloVista = document.getElementById('titulo-vista');

const titulos = {
    todas: 'Resumen general',
    cpu: 'Procesador',
    memoria: 'Memoria RAM',
    discos: 'Almacenamiento',
    red: 'Interfaces de red'
};

function mostrarSeccion(seccion) {
    tituloVista.textContent = titulos[seccion];

    paneles.forEach((panel) => {
        const mostrarTodos = seccion === 'todas';

        panel.hidden = !mostrarTodos && panel.dataset.panel !== seccion;
        panel.classList.toggle('col-xl-6', mostrarTodos);
    });

    botones.forEach((boton) => {
        const seleccionado = boton.dataset.seccion === seccion;

        boton.classList.toggle('btn-light', seleccionado);
        boton.classList.toggle('btn-outline-light', !seleccionado);
        boton.setAttribute('aria-pressed', String(seleccionado));
    });
}

botones.forEach((boton) => {
    boton.addEventListener('click', () => {
        mostrarSeccion(boton.dataset.seccion);
    });
});

mostrarSeccion('cpu');

// Conectar al mismo servidor que entrega la página.
const socket = io();

const estadoConexion = document.getElementById('estado-conexion');

socket.on('connect', () => {
    estadoConexion.textContent = 'Conectado · Esperando actualización';
});

socket.on('disconnect', () => {
    estadoConexion.textContent =
        'Desconectado · Los datos pueden estar desactualizados';
});

socket.on('connect_error', () => {
    estadoConexion.textContent = 'Sin conexión con el servidor';
});

socket.on('datosSistema', (datos) => {
    estadoConexion.textContent = 'Conectado · Datos recibidos';

    document.getElementById('cpu').innerHTML = `
        <h3>CPU</h3>
        <span>Fabricante:</span> ${datos.cpu.fabricante}<br>
        <span>Modelo:</span> ${datos.cpu.modelo}<br>
        <span>Núcleos:</span> ${datos.cpu.nucleos}<br>
        <span>Temperatura:</span> ${datos.cpu.temperatura}
    `;

    document.getElementById('memoria').innerHTML = `
        <h3>Memoria</h3>
        <span>Total:</span> ${datos.memoria.total}<br>
        <span>Libre:</span> ${datos.memoria.libre}<br>
        <span>Usado:</span> ${datos.memoria.usado}
    `;

    let discosHtml = '<h3>Discos</h3>';

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

    const redHtml = datos.red.map((iface) => `
        <div class="mb-3">
            <span>Interfaz:</span> ${iface.interfaz}<br>
            <span>IP:</span> ${iface.ip4}<br>
            <span>MAC:</span> ${iface.mac}<br>
            <span>Recibido:</span> ${iface.recibidoMB} MB<br>
            <span>Enviado:</span> ${iface.enviadoMB} MB
        </div>
    `).join('');

    document.getElementById('red').innerHTML = `<h3>Red</h3>${redHtml}`;
});