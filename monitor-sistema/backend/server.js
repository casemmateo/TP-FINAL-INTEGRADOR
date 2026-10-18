const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const si = require('systeminformation');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Servir el frontend desde su carpeta.
// __dirname representa la carpeta donde está server.js.
// path.join construye la ruta hasta frontend/public.
app.use(express.static(
    path.join(__dirname, '../frontend/public')
));

// Al dividir por 1024 elevado a 3, la unidad es GiB.
function bytesToGiB(bytes) {
    return (bytes / (1024 ** 3)).toFixed(2) + ' GiB';
}

async function obtenerDatosSistema() {
    try {
        const [memoria, cpu, cpuTemp, discos, interfaces] = await Promise.all([
            si.mem(),
            si.cpu(),
            si.cpuTemperature(),
            si.fsSize(),
            si.networkInterfaces()
        ]);

        // Buscar la raíz por su montaje, no por el nombre del dispositivo.
        const sda1 = discos.find(d => d.mount === '/') || null;

        // Usar el tamaño real de swap, sin agregar un valor de respaldo.
        const swapSize = memoria.swaptotal;

        const red = await Promise.all(
            interfaces.map(async (iface) => {
                const stats = await si.networkStats(iface.iface);
                const s = stats[0] || {};

                return {
                    interfaz: iface.iface,
                    ip4: iface.ip4,
                    mac: iface.mac,
                    recibidoMiB: s.rx_bytes
                        ? (s.rx_bytes / (1024 * 1024)).toFixed(2)
                        : '0.00',
                    enviadoMiB: s.tx_bytes
                        ? (s.tx_bytes / (1024 * 1024)).toFixed(2)
                        : '0.00'
                };
            })
        );

        return {
            timestamp: new Date().toISOString(),
            cpu: {
                fabricante: cpu.manufacturer || 'Desconocido',
                modelo: cpu.brand || 'Desconocido',
                nucleos: cpu.cores,
                temperatura: cpuTemp.main ? `${cpuTemp.main} °C` : 'N/D'
            },
            memoria: {
                total: bytesToGiB(memoria.total),
                libre: bytesToGiB(memoria.available),
                usado: bytesToGiB(memoria.total - memoria.available)
            },
            particiones: {
                // Conservamos las claves del ejemplo del material.
                sda1: sda1 ? {
                    filesystem: sda1.fs,
                    tamaño: bytesToGiB(sda1.size),
                    usado: bytesToGiB(sda1.used),
                    libre: bytesToGiB(sda1.available),
                    usoPorcentaje: sda1.use + '%',
                    puntoMontaje: sda1.mount
                } : null,
                // Estos datos representan el total de swap del sistema.
                sda5: swapSize > 0 ? {
                    tamaño: bytesToGiB(swapSize),
                    usado: bytesToGiB(memoria.swapused),
                    libre: bytesToGiB(swapSize - memoria.swapused),
                    usoPorcentaje:
                        ((memoria.swapused / swapSize) * 100).toFixed(2) + '%',
                    esSwap: true
                } : null
            },
            red
        };
    } catch (error) {
        console.error('Error al obtener datos del sistema:', error);
        throw error;
    }
}

// La API sigue disponible para consultar los datos directamente.
app.get('/api/sistema', async (req, res) => {
    try {
        const datos = await obtenerDatosSistema();
        res.json(datos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

io.on('connection', (socket) => {
    console.log('Cliente conectado');

    const intervalo = setInterval(async () => {
        try {
            const datos = await obtenerDatosSistema();
            socket.emit('datosSistema', datos);
        } catch (error) {
            console.error('Error en WebSocket:', error);
        }
    }, 5000);

    socket.on('disconnect', () => {
        clearInterval(intervalo);
        console.log('Cliente desconectado');
    });
});

const PORT = 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});