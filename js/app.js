document.addEventListener('DOMContentLoaded', function() {
    
    const vistaBienvenida = document.getElementById('vista-bienvenida');
    const appContainer = document.getElementById('app-container');
    const btnIniciar = document.getElementById('btn-iniciar-app');

    btnIniciar.addEventListener('click', () => {
        vistaBienvenida.classList.add('fade-out');
        appContainer.style.display = 'block';
        cargarDatosEInicializar();
    });
});

async function cargarDatosEInicializar() {
    try {
        let jugadores;
        const jugadoresGuardados = localStorage.getItem('golf_jugadores');

        if (jugadoresGuardados) {
            jugadores = JSON.parse(jugadoresGuardados);
        } else {
            const respuestaJugadores = await fetch('data/jugadores.json');
            jugadores = await respuestaJugadores.json();
            localStorage.setItem('golf_jugadores', JSON.stringify(jugadores));
        }

        const respuestaCursos = await fetch('data/cursos.json');
        const cursos = await respuestaCursos.json();

        inicializarAppPrincipal(jugadores, cursos);

    } catch (error) {
        console.error("Error al cargar los datos iniciales:", error);
        document.body.innerHTML = '<div style="text-align: center; padding: 2rem;"><h1>Error</h1><p>No se pudieron cargar los datos de jugadores y canchas. Por favor, revisa la consola para más detalles.</p></div>';
    }
}

function inicializarAppPrincipal(jugadoresData, cursosData) {
    
    let jugadores = jugadoresData;
    const cursos = cursosData;
    
    let estadoApp = {
        partidaActual: null,
        partidasGuardadas: [],
        modoConfiguracion: null
    };
    let partidaAEliminarId = null;

    const vistas = {
        menu: document.getElementById('vista-menu-principal'),
        config: document.getElementById('vista-configuracion'),
        scores: document.getElementById('vista-scores'),
        resultados: document.getElementById('vista-resultados'),
        debug: document.getElementById('vista-debug'),
        gestionJugadores: document.getElementById('vista-gestion-jugadores')
    };
    const configuracionPaneles = {
        parejas: document.getElementById('config-parejas'),
        individual: document.getElementById('config-individual')
    };
    const tituloConfiguracion = document.getElementById('titulo-configuracion');
    const listaPartidasDiv = document.getElementById('lista-partidas');
    const infoPartidaDiv = document.getElementById('info-partida');
    const tablaScoresDiv = document.getElementById('tabla-scores');
    const selectorCurso = document.getElementById('selector-curso');
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const contenedorFilasParejas = document.getElementById('contenedor-filas-parejas');
    const contenedorResultadosDiv = document.getElementById('contenedor-resultados');
    const contenedorDebugDiv = document.getElementById('contenedor-debug');
    const valorApuestaInput = document.getElementById('valor-apuesta');
    const contenedorApuestasDiv = document.getElementById('contenedor-apuestas');
    const contenedorApuestasDoblesDiv = document.getElementById('contenedor-apuestas-dobles');
    const contenedorResumenApuestasDiv = document.getElementById('contenedor-resumen-apuestas');
    const btnToggleApuestas = document.getElementById('btn-toggle-apuestas');
    const modalConfirmacionIndividual = document.getElementById('modal-confirmacion-individual');
    
    const formJugador = document.getElementById('form-jugador');
    const inputJugadorId = document.getElementById('jugador-id');
    const inputJugadorNombre = document.getElementById('jugador-nombre');
    const inputJugadorHdcp = document.getElementById('jugador-hdcp');
    const listaGestionJugadoresDiv = document.getElementById('lista-gestion-jugadores');
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

    configurarEventListeners();
    estadoApp.partidasGuardadas = cargarPartidasDeLocalStorage();
    renderizarListaPartidas();
    poblarSelectorDeCursos();
    poblarTodosLosSelectoresDeJugadores();
    renderizarListaGestionJugadores();
    mostrarVista('menu');

    function mostrarVista(nombreVista) {
        Object.values(vistas).forEach(vista => {
            if (vista) vista.style.display = 'none';
        });
        if (vistas[nombreVista]) {
            vistas[nombreVista].style.display = 'block';
        }
    }

    function mostrarModalConfirmacion(visible) {
        modalConfirmacion.style.display = visible ? 'flex' : 'none';
    }

    function mostrarModalConfirmacionIndividual(visible) {
        modalConfirmacionIndividual.style.display = visible ? 'flex' : 'none';
    }

    function cargarPartidasDeLocalStorage() {
        const partidasJSON = localStorage.getItem('golf_partidas');
        return partidasJSON ? JSON.parse(partidasJSON) : [];
    }

    function guardarPartidasEnLocalStorage() {
        localStorage.setItem('golf_partidas', JSON.stringify(estadoApp.partidasGuardadas));
    }
    
    function guardarJugadoresEnLocalStorage() {
        localStorage.setItem('golf_jugadores', JSON.stringify(jugadores));
    }
    
    function poblarSelectorDeCursos() {
        selectorCurso.innerHTML = '';
        cursos.forEach(curso => {
            const opcion = document.createElement('option');
            opcion.value = curso.id;
            opcion.textContent = curso.nombre;
            selectorCurso.appendChild(opcion);
        });
    }

    function poblarTodosLosSelectoresDeJugadores() {
        const todosLosSelects = document.querySelectorAll('.selector-jugador');
        todosLosSelects.forEach(select => {
            const valorPrevio = select.value;
            select.innerHTML = '<option value="">-- Seleccionar --</option>'; 
            [...jugadores].sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach(jugador => {
                const opcion = document.createElement('option');
                opcion.value = jugador.id;
                opcion.textContent = `${jugador.nombre} (HDCP: ${jugador.hdcp})`;
                select.appendChild(opcion);
            });
            select.value = valorPrevio;
        });
    }

    function renderizarListaGestionJugadores() {
        if (!listaGestionJugadoresDiv) return;
        if (jugadores.length === 0) {
            listaGestionJugadoresDiv.innerHTML = "<p>No hay jugadores registrados.</p>";
            return;
        }

        let tablaHTML = '<table><thead><tr><th>ID</th><th>Nombre</th><th>HDCP</th><th>Acciones</th></tr></thead><tbody>';
        
        [...jugadores].sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach(jugador => {
            tablaHTML += `
                <tr>
                    <td>${jugador.id}</td>
                    <td class="jugador-nombre">${jugador.nombre}</td>
                    <td class="jugador-hdcp">${jugador.hdcp}</td>
                    <td class="acciones-jugador">
                        <button class="btn-editar-jugador" data-id="${jugador.id}">✏️</button>
                        <button class="btn-eliminar-jugador btn-peligro" data-id="${jugador.id}">X</button>
                    </td>
                </tr>
            `;
        });
        tablaHTML += '</tbody></table>';
        listaGestionJugadoresDiv.innerHTML = tablaHTML;
    }
    
    function renderizarListaPartidas() {
        const btnEliminar = document.getElementById('btn-eliminar-todo');
        if (estadoApp.partidasGuardadas.length === 0) {
            listaPartidasDiv.innerHTML = '<p>No hay partidas guardadas.</p>';
            btnEliminar.style.display = 'none';
            return;
        }
        btnEliminar.style.display = 'block';
        const partidasAgrupadas = estadoApp.partidasGuardadas.reduce((acc, partida) => {
            const modo = partida.modo;
            const cursoId = partida.cursoId;
            const fecha = partida.fecha;
            if (!acc[modo]) acc[modo] = {};
            if (!acc[modo][cursoId]) acc[modo][cursoId] = {};
            if (!acc[modo][cursoId][fecha]) acc[modo][cursoId][fecha] = [];
            acc[modo][cursoId][fecha].push(partida);
            return acc;
        }, {});
        
        let html = '<details class="partidas-guardadas-main"><summary>⊕ Partidas Guardadas</summary>';
        for (const modo in partidasAgrupadas) {
            const nombreModo = modo.charAt(0).toUpperCase() + modo.slice(1);
            html += `<details class="grupo-modo"><summary>Partidas en ${nombreModo}</summary>`;
            for (const cursoId in partidasAgrupadas[modo]) {
                const curso = cursos.find(c => c.id === cursoId);
                const nombreCurso = curso ? curso.nombre : 'Cancha Desconocida';
                html += `<details class="grupo-curso"><summary>${nombreCurso}</summary>`;
                for (const fecha in partidasAgrupadas[modo][cursoId]) {
                    html += `<details class="grupo-fecha"><summary>${fecha}</summary><ul>`;
                    partidasAgrupadas[modo][cursoId][fecha].forEach(partida => {
                        html += `<li class="fila-partida">
                                    <a href="#" data-partida-id="${partida.id}">${partida.descripcion}</a>
                                    <button class="btn-eliminar-partida btn-peligro" data-partida-id="${partida.id}" title="Eliminar esta partida">×</button>
                                 </li>`;
                    });
                    html += `</ul></details>`;
                }
                html += `</details>`;
            }
            html += `</details>`;
        }
        html += `</details>`;
        listaPartidasDiv.innerHTML = html;
    }

    function renderizarTablaScores() {
        if (!estadoApp.partidaActual) return;
        const cursoSeleccionado = cursos.find(c => c.id === estadoApp.partidaActual.cursoId);
        if (!cursoSeleccionado) {
            tablaScoresDiv.innerHTML = '<p>Error: No se encontró el curso seleccionado.</p>';
            return;
        }
        infoPartidaDiv.innerHTML = `<h3>Anotando: ${estadoApp.partidaActual.descripcion}</h3><h4>Cancha: ${cursoSeleccionado.nombre}</h4>`;
        
        let cabecerasJugadores = '';
        estadoApp.partidaActual.jugadores.forEach(id => {
            const jugador = jugadores.find(j => j.id == id);
            const nombreMostrado = jugador ? jugador.nombre : `ID ${id}`;
            cabecerasJugadores += `<th>${nombreMostrado}</th>`;
        });

        let tablaHTML = `<table><thead><tr><th class="columna-hoyo">Hoyo</th><th>Par</th><th class="columna-index">Index</th>${cabecerasJugadores}</tr></thead><tbody>`;
        
        for (let i = 0; i < 9; i++) {
            tablaHTML += `<tr><td class="columna-hoyo">${i + 1}</td><td>${cursoSeleccionado.par[i]}</td><td class="columna-index">${cursoSeleccionado.index[i]}</td>`;
            estadoApp.partidaActual.jugadores.forEach(id => {
                const score = estadoApp.partidaActual.scores[i][id] || '';
                tablaHTML += `<td><input type="number" min="1" class="score-input" data-hoyo="${i}" data-jugador="${id}" value="${score}"></td>`;
            });
            tablaHTML += '</tr>';
        }
        tablaHTML += '<tr class="subtotal-row"><td class="columna-hoyo"><b>OUT</b></td><td></td><td class="columna-index"></td>';
        estadoApp.partidaActual.jugadores.forEach(id => { tablaHTML += `<td id="total-out-${id}">0</td>`; });
        tablaHTML += '</tr>';
        for (let i = 9; i < 18; i++) {
            tablaHTML += `<tr><td class="columna-hoyo">${i + 1}</td><td>${cursoSeleccionado.par[i]}</td><td class="columna-index">${cursoSeleccionado.index[i]}</td>`;
            estadoApp.partidaActual.jugadores.forEach(id => {
                const score = estadoApp.partidaActual.scores[i][id] || '';
                tablaHTML += `<td><input type="number" min="1" class="score-input" data-hoyo="${i}" data-jugador="${id}" value="${score}"></td>`;
            });
            tablaHTML += '</tr>';
        }
        tablaHTML += '<tr class="subtotal-row"><td class="columna-hoyo"><b>IN</b></td><td></td><td class="columna-index"></td>';
        estadoApp.partidaActual.jugadores.forEach(id => { tablaHTML += `<td id="total-in-${id}">0</td>`; });
        tablaHTML += '</tr>';
        tablaHTML += '<tr class="total-row fila-total-gross"><td class="columna-hoyo"><b>TOTAL</b></td><td></td><td class="columna-index"></td>';
        estadoApp.partidaActual.jugadores.forEach(id => { tablaHTML += `<td id="total-gross-${id}">0</td>`; });
        tablaHTML += '</tr>';
        tablaHTML += '<tr class="total-row"><td class="columna-hoyo"><b>HDCP</b></td><td></td><td class="columna-index"></td>';
        estadoApp.partidaActual.jugadores.forEach(id => { tablaHTML += `<td id="total-hdcp-${id}">0</td>`; });
        tablaHTML += '</tr>';
        tablaHTML += '<tr class="total-row fila-neto"><td class="columna-hoyo"><b>NETO</b></td><td></td><td class="columna-index"></td>';
        estadoApp.partidaActual.jugadores.forEach(id => { tablaHTML += `<td id="total-neto-${id}">0</td>`; });
        tablaHTML += '</tr>';
        tablaHTML += '</tbody></table>';
        tablaScoresDiv.innerHTML = tablaHTML;
        actualizarTotalesEnTabla();
    }
    

    // --- AJUSTE 3 (del requerimiento anterior, se mantiene): Nueva función auxiliar para "traducir" IDs a Nombres ---
    function traducirDescripcionConNombres(descripcion) {
        if (typeof descripcion !== 'string') return ''; // Guarda contra valores no válidos
        // Usa una expresión regular para encontrar todos los números (IDs)
        const idsEncontrados = descripcion.match(/\d+/g);
        if (!idsEncontrados) return descripcion; // Si no hay IDs, devuelve el original

        let descripcionTraducida = descripcion;
        // Reemplaza cada ID encontrado por su nombre correspondiente
        idsEncontrados.forEach(id => {
            const jugador = jugadores.find(j => j.id == id);
            const nombre = jugador ? jugador.nombre : `ID ${id}`;
            // Usa una nueva expresión regular para reemplazar solo ese ID específico
            descripcionTraducida = descripcionTraducida.replace(new RegExp(`\\b${id}\\b`), nombre);
        });
        return descripcionTraducida;
    }
    
    // --- MANEJO DE EVENTOS ---
    function configurarEventListeners() {
        document.getElementById('btn-gestionar-jugadores').addEventListener('click', () => mostrarVista('gestionJugadores'));
        document.getElementById('btn-nueva-partida-parejas').addEventListener('click', () => {
            estadoApp.modoConfiguracion = 'parejas';
            tituloConfiguracion.textContent = 'Nueva Partida en Parejas';
            configuracionPaneles.individual.style.display = 'none';
            configuracionPaneles.parejas.style.display = 'block';
            mostrarVista('config');
        });
        document.getElementById('btn-nueva-partida-individual').addEventListener('click', () => {
            estadoApp.modoConfiguracion = 'individual';
            tituloConfiguracion.textContent = 'Nueva Partida Individual';
            configuracionPaneles.parejas.style.display = 'none';
            configuracionPaneles.individual.style.display = 'block';
            mostrarVista('config');
        });
        
        document.getElementById('btn-volver-a-menu-principal').addEventListener('click', () => mostrarVista('menu'));
        formJugador.addEventListener('submit', handleGuardarJugador);
        btnCancelarEdicion.addEventListener('click', resetearFormularioJugador);
        listaGestionJugadoresDiv.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (id) {
                if (target.classList.contains('btn-editar-jugador')) {
                    handleEditarJugador(id);
                } else if (target.classList.contains('btn-eliminar-jugador')) {
                    if (confirm('¿Estás seguro de que deseas eliminar a este jugador? Esta acción no se puede deshacer.')) {
                        handleEliminarJugador(id);
                    }
                }
            }
        });

        document.getElementById('btn-volver-menu').addEventListener('click', () => mostrarVista('menu'));
        document.getElementById('btn-empezar-partida').addEventListener('click', handleEmpezarPartida);
        document.getElementById('btn-agregar-pareja').addEventListener('click', agregarFilaDePareja);
        
        vistas.config.addEventListener('change', (e) => {
            if (e.target.classList.contains('selector-jugador')) {
                validarSeleccionDeJugadores();
            }
        });
        
        listaPartidasDiv.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'A' && target.dataset.partidaId) {
                e.preventDefault();
                const partidaId = parseInt(target.dataset.partidaId, 10);
                cargarPartidaSeleccionada(partidaId);
            }
            if (target.classList.contains('btn-eliminar-partida')) {
                e.preventDefault();
                const partidaId = parseInt(target.dataset.partidaId, 10);
                partidaAEliminarId = partidaId;
                mostrarModalConfirmacionIndividual(true);
            }
        });

        document.getElementById('btn-eliminar-todo').addEventListener('click', () => mostrarModalConfirmacion(true));
        document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => mostrarModalConfirmacion(false));
        document.getElementById('btn-confirmar-eliminar').addEventListener('click', handleEliminarTodasLasPartidas);
        
        document.getElementById('btn-confirmar-eliminar-individual').addEventListener('click', () => {
            if (partidaAEliminarId) {
                handleEliminarPartida(partidaAEliminarId);
                partidaAEliminarId = null;
            }
            mostrarModalConfirmacionIndividual(false);
        });

        document.getElementById('btn-cancelar-eliminar-individual').addEventListener('click', () => {
            partidaAEliminarId = null;
            mostrarModalConfirmacionIndividual(false);
        });

        tablaScoresDiv.addEventListener('input', (e) => {
            if (e.target.classList.contains('score-input')) {
                handleScoreInput(e);
            }
        });
        document.getElementById('btn-toggle-index').addEventListener('click', () => {
            const tabla = tablaScoresDiv.querySelector('table');
            if (tabla) {
                tabla.classList.toggle('mostrar-index');
            }
        });
        
        document.getElementById('btn-guardar-partida').addEventListener('click', handleGuardarPartida);
        document.getElementById('btn-ver-resultados').addEventListener('click', handleVerResultados);
        document.getElementById('btn-salir').addEventListener('click', handleSalir);
        document.getElementById('btn-volver-a-scores').addEventListener('click', () => {
            vistas.debug.style.display = 'none';
            mostrarVista('scores');
        });
        document.getElementById('btn-toggle-debug').addEventListener('click', () => {
            vistas.debug.style.display = vistas.debug.style.display === 'none' ? 'block' : 'none';
        });

        if (btnToggleApuestas) {
            btnToggleApuestas.addEventListener('click', () => {
                if (contenedorApuestasDiv) contenedorApuestasDiv.classList.toggle('oculto');
                if (contenedorApuestasDoblesDiv) contenedorApuestasDoblesDiv.classList.toggle('oculto');
            });
        }
    }

    // --- LÓGICA DE LA APLICACIÓN Y FUNCIONES CRUD ---

    function handleGuardarJugador(e) {
        e.preventDefault();
        const id = inputJugadorId.value;
        const nombre = inputJugadorNombre.value.trim();
        const hdcp = parseInt(inputJugadorHdcp.value, 10);

        if (!nombre || isNaN(hdcp)) {
            alert('Por favor, completa todos los campos correctamente.');
            return;
        }

        const nombreNormalizado = nombre.toLowerCase();
        const jugadorExistente = jugadores.find(j => j.nombre.toLowerCase() === nombreNormalizado);

        if (jugadorExistente && jugadorExistente.id != id) {
            alert(`Error: Ya existe un jugador con el nombre "${nombre}".`);
            return;
        }

        if (id) {
            const index = jugadores.findIndex(j => j.id == id);
            if (index !== -1) {
                jugadores[index] = { ...jugadores[index], nombre, hdcp };
            }
        } else {
            const maxId = jugadores.length > 0 ? Math.max(...jugadores.map(j => parseInt(j.id))) : 0;
            const nuevoId = maxId + 1;
            jugadores.push({ id: nuevoId, nombre, hdcp });
        }

        guardarJugadoresEnLocalStorage();
        renderizarListaGestionJugadores();
        poblarTodosLosSelectoresDeJugadores();
        resetearFormularioJugador();
    }

    function handleEditarJugador(id) {
        const jugador = jugadores.find(j => j.id == id);
        if (jugador) {
            inputJugadorId.value = jugador.id;
            inputJugadorNombre.value = jugador.nombre;
            inputJugadorHdcp.value = jugador.hdcp;
            btnCancelarEdicion.style.display = 'inline-block';
            formJugador.querySelector('button[type="submit"]').textContent = 'Actualizar Jugador';
            inputJugadorNombre.focus();
        }
    }

    function handleEliminarJugador(id) {
        jugadores = jugadores.filter(j => j.id != id);
        guardarJugadoresEnLocalStorage();
        renderizarListaGestionJugadores();
        poblarTodosLosSelectoresDeJugadores();
    }

    function resetearFormularioJugador() {
        formJugador.reset();
        inputJugadorId.value = '';
        btnCancelarEdicion.style.display = 'none';
        formJugador.querySelector('button[type="submit"]').textContent = 'Guardar Jugador';
    }
    
    function actualizarTotalesEnTabla() {
        if (!estadoApp.partidaActual) return;
        estadoApp.partidaActual.jugadores.forEach(jugadorId => {
            const scores = estadoApp.partidaActual.scores;
            const outScore = scores.slice(0, 9).reduce((sum, hoyo) => sum + (hoyo[jugadorId] || 0), 0);
            const inScore = scores.slice(9, 18).reduce((sum, hoyo) => sum + (hoyo[jugadorId] || 0), 0);
            const totalGross = outScore + inScore;
            const jugadorInfo = jugadores.find(j => j.id == jugadorId);
            const hdcp = jugadorInfo ? jugadorInfo.hdcp : 0;
            const neto = totalGross - hdcp;
            document.getElementById(`total-out-${jugadorId}`).textContent = outScore;
            document.getElementById(`total-in-${jugadorId}`).textContent = inScore;
            document.getElementById(`total-gross-${jugadorId}`).textContent = totalGross;
            document.getElementById(`total-hdcp-${jugadorId}`).textContent = hdcp;
            document.getElementById(`total-neto-${jugadorId}`).textContent = neto;
        });
    }

    function agregarFilaDePareja() {
        const numParejas = contenedorFilasParejas.children.length + 1;
        const nuevaFila = document.createElement('div');
        nuevaFila.className = 'form-group fila-pareja';
        nuevaFila.innerHTML = `
            <label>Pareja ${numParejas}</label>
            <select class="selector-jugador"></select>
            <select class="selector-jugador"></select>
        `;
        contenedorFilasParejas.appendChild(nuevaFila);
        poblarTodosLosSelectoresDeJugadores();
        validarSeleccionDeJugadores();
    }

    function validarSeleccionDeJugadores() {
        // Se mantiene vacía para permitir selección múltiple.
    }

    function handleEmpezarPartida() {
        const cursoId = selectorCurso.value;
        if (!cursoId) { alert('Por favor, seleccione una cancha.'); return; }
        let nuevaPartida = {
            id: Date.now(),
            fecha: new Date().toLocaleDateString('es-EC'),
            modo: estadoApp.modoConfiguracion,
            cursoId: cursoId,
            jugadores: [],
            descripcion: '',
            scores: Array(18).fill(null).map(() => ({}))
        };
        if (estadoApp.modoConfiguracion === 'parejas') {
            const filasParejas = contenedorFilasParejas.querySelectorAll('.fila-pareja');
            let todasLasParejas = [];
            let todosLosJugadoresSeleccionados = [];
            for(const fila of filasParejas) {
                const selectores = fila.querySelectorAll('select');
                const j1 = selectores[0].value;
                const j2 = selectores[1].value;
                if (j1 && j2) {
                    if(j1 === j2) {
                        alert(`Error en ${fila.querySelector('label').textContent}: Un jugador no puede estar dos veces en la misma pareja.`);
                        return;
                    }
                    todasLasParejas.push([j1, j2]);
                    todosLosJugadoresSeleccionados.push(j1, j2);
                }
            }
            
            if(todasLasParejas.length < 2) {
                alert('Debe haber al menos dos parejas completas para empezar.');
                return;
            }
            nuevaPartida.jugadores = todosLosJugadoresSeleccionados;
            
            nuevaPartida.descripcion = 'Parejas: ' + todasLasParejas.map(p => {
                const j1 = jugadores.find(j => j.id == p[0]);
                const j2 = jugadores.find(j => j.id == p[1]);
                return (j1 ? j1.nombre : p[0]) + ' & ' + (j2 ? j2.nombre : p[1]);
            }).join(' vs ');
        } else {
            const j1Id = document.getElementById('ind_j1').value;
            const j2Id = document.getElementById('ind_j2').value;
            if (!j1Id || !j2Id) { alert('Por favor, seleccione ambos jugadores.'); return; }
             if (j1Id === j2Id) { alert('Por favor, seleccione dos jugadores diferentes.'); return; }
            nuevaPartida.jugadores = [j1Id, j2Id];
            const j1 = jugadores.find(j => j.id == j1Id);
            const j2 = jugadores.find(j => j.id == j2Id);
            nuevaPartida.descripcion = `Individual: ${(j1 ? j1.nombre : j1Id)} vs ${(j2 ? j2.nombre : j2Id)}`;
        }
        estadoApp.partidaActual = nuevaPartida;
        estadoApp.partidasGuardadas.push(nuevaPartida);
        guardarPartidasEnLocalStorage();
        renderizarListaPartidas();
        renderizarTablaScores();
        mostrarVista('scores');
    }

    function cargarPartidaSeleccionada(partidaId) {
        const partida = estadoApp.partidasGuardadas.find(p => p.id === partidaId);
        if (partida) {
            estadoApp.partidaActual = partida;
            renderizarTablaScores();
            mostrarVista('scores');
        }
    }
    
    function handleEliminarPartida(partidaId) {
        estadoApp.partidasGuardadas = estadoApp.partidasGuardadas.filter(p => p.id !== partidaId);
        guardarPartidasEnLocalStorage();
        renderizarListaPartidas();

        if (estadoApp.partidaActual && estadoApp.partidaActual.id === partidaId) {
            estadoApp.partidaActual = null;
            mostrarVista('menu'); 
        }
    }

    function handleEliminarTodasLasPartidas() {
        estadoApp.partidasGuardadas = [];
        estadoApp.partidaActual = null;
        localStorage.removeItem('golf_partidas');
        renderizarListaPartidas();
        mostrarModalConfirmacion(false);
    }

    function handleScoreInput(e) {
        if (!estadoApp.partidaActual) return;
        const input = e.target;
        const hoyoIndex = parseInt(input.dataset.hoyo, 10);
        const jugadorId = input.dataset.jugador;
        const score = input.value === '' ? null : parseInt(input.value, 10);
        estadoApp.partidaActual.scores[hoyoIndex][jugadorId] = score;
        actualizarTotalesEnTabla();
    }

    function handleGuardarPartida() {
        if (estadoApp.partidaActual) {
            const index = estadoApp.partidasGuardadas.findIndex(p => p.id === estadoApp.partidaActual.id);
            if (index !== -1) {
                estadoApp.partidasGuardadas[index] = estadoApp.partidaActual;
            } else {
                estadoApp.partidasGuardadas.push(estadoApp.partidaActual);
            }
            guardarPartidasEnLocalStorage();
            alert('Partida guardada con éxito.');
        }
    }

    function handleVerResultados() {
        if (!estadoApp.partidaActual) return;
        handleGuardarPartida();
        
        const valorApuesta = valorApuestaInput ? (parseFloat(valorApuestaInput.value) || 5) : 5;
        const resultados = calcularResultados(estadoApp.partidaActual);
        
        renderizarResultados(resultados); 
        renderizarDebugView(resultados);

        if (estadoApp.partidaActual.modo === 'parejas' && resultados.resultadosFoursome.length > 0) {
            const todosLosCalculos = calcularTodasLasApuestas(resultados.resultadosFoursome, estadoApp.partidaActual.jugadores, valorApuesta);
            
            contenedorApuestasDiv.classList.add('oculto');
            contenedorApuestasDoblesDiv.classList.add('oculto');
            btnToggleApuestas.style.display = 'inline-block';

            renderizarTablaApuestas(todosLosCalculos.apuestasSimples, estadoApp.partidaActual.jugadores, todosLosCalculos.totalesSimples);
            renderizarTablaApuestasDobles(todosLosCalculos.apuestasDobles, estadoApp.partidaActual.jugadores, todosLosCalculos.totalesDobles);
            renderizarResumenApuestas(todosLosCalculos.totalesFinales);
        } else {
             contenedorApuestasDiv.innerHTML = ''; 
             contenedorApuestasDoblesDiv.innerHTML = '';
             contenedorResumenApuestasDiv.innerHTML = '';
             btnToggleApuestas.style.display = 'none';
        }
        
        mostrarVista('resultados');
    }

    function handleSalir() {
        estadoApp.partidaActual = null;
        renderizarListaPartidas();
        mostrarVista('menu');
    }
    
    function calcularResultados(partida) {
        const curso = cursos.find(c => c.id === partida.cursoId);
        if (!curso) return null;
        let resultadosFoursome = [];
        if (partida.modo === 'parejas') {
            const numParejas = partida.jugadores.length / 2;
            for (let i = 0; i < numParejas; i++) {
                for (let j = i + 1; j < numParejas; j++) {
                    const p1_j1_id = partida.jugadores[i * 2];
                    const p1_j2_id = partida.jugadores[i * 2 + 1];
                    const p2_j1_id = partida.jugadores[j * 2];
                    const p2_j2_id = partida.jugadores[j * 2 + 1];
                    const hándicapsDelMatch = [
                        jugadores.find(p => p.id == p1_j1_id).hdcp,
                        jugadores.find(p => p.id == p1_j2_id).hdcp,
                        jugadores.find(p => p.id == p2_j1_id).hdcp,
                        jugadores.find(p => p.id == p2_j2_id).hdcp
                    ];
                    const handicapDeJuego = Math.min(...hándicapsDelMatch);
                    const resultadoMatch = {
                        // --- AJUSTE 4: Se corrige la descripción para que no incluya los índices de pareja,
                        // pero se añaden nuevas propiedades para almacenar los IDs de forma segura.
                        descripcion: `Pareja (${p1_j1_id} & ${p1_j2_id}) vs Pareja (${p2_j1_id} & ${p2_j2_id})`,
                        pareja1_ids: [p1_j1_id, p1_j2_id],
                        pareja2_ids: [p2_j1_id, p2_j2_id],
                        // --- FIN DEL AJUSTE ---
                        handicapDeJuego: handicapDeJuego,
                        bestBall: { p1: Array(18).fill(0), p2: Array(18).fill(0) },
                        aggregate: { p1: Array(18).fill(0), p2: Array(18).fill(0) },
                        detallesDebug: []
                    };
                    for (let hoyo = 0; hoyo < 18; hoyo++) {
                        const indexHoyo = curso.index[hoyo];
                        const getScoreNeto = (jugadorId) => {
                            const scoreBruto = partida.scores[hoyo][jugadorId];
                            if (scoreBruto === null || scoreBruto === 0) return null;
                            const hdcpJugador = jugadores.find(j => j.id == jugadorId).hdcp;
                            const hdcpAjustado = hdcpJugador - handicapDeJuego;
                            let ventaja = 0;
                            if (indexHoyo <= hdcpAjustado) {
                                ventaja = 1;
                                if (hdcpAjustado > 18 && (hdcpAjustado - 18) >= indexHoyo) {
                                    ventaja = 2;
                                }
                            }
                            return scoreBruto - ventaja;
                        };
                        const netoP1J1 = getScoreNeto(p1_j1_id);
                        const netoP1J2 = getScoreNeto(p1_j2_id);
                        const netoP2J1 = getScoreNeto(p2_j1_id);
                        const netoP2J2 = getScoreNeto(p2_j2_id);
                        const bestBallP1 = Math.min(netoP1J1 ?? Infinity, netoP1J2 ?? Infinity);
                        const bestBallP2 = Math.min(netoP2J1 ?? Infinity, netoP2J2 ?? Infinity);
                        let ganadorBB = '-';
                        if (bestBallP1 !== Infinity && bestBallP2 !== Infinity) {
                            if (bestBallP1 < bestBallP2) {
                                resultadoMatch.bestBall.p1[hoyo] = 1;
                                ganadorBB = `${p1_j1_id} & ${p1_j2_id}`;
                            } else if (bestBallP2 < bestBallP1) {
                                resultadoMatch.bestBall.p2[hoyo] = 1;
                                ganadorBB = `${p2_j1_id} & ${p2_j2_id}`;
                            }
                        }
                        const aggregateP1 = (netoP1J1 ?? 0) + (netoP1J2 ?? 0);
                        const aggregateP2 = (netoP2J1 ?? 0) + (netoP2J2 ?? 0);
                        let ganadorAgg = '-';
                        if(aggregateP1 !== 0 && aggregateP2 !== 0) {
                           if (aggregateP1 < aggregateP2) {
                               resultadoMatch.aggregate.p1[hoyo] = 1;
                               ganadorAgg = `${p1_j1_id} & ${p1_j2_id}`;
                           } else if (aggregateP2 < aggregateP1) {
                               resultadoMatch.aggregate.p2[hoyo] = 1;
                               ganadorAgg = `${p2_j1_id} & ${p2_j2_id}`;
                           }
                        }
                        resultadoMatch.detallesDebug.push({
                            hoyo: hoyo + 1, index: indexHoyo,
                            netoP1J1, netoP1J2, bestBallP1,
                            netoP2J1, netoP2J2, bestBallP2,
                            puntoBB_P1: resultadoMatch.bestBall.p1[hoyo],
                            puntoBB_P2: resultadoMatch.bestBall.p2[hoyo],
                            ganadorBB,
                            aggregateP1, aggregateP2,
                            puntoAgg_P1: resultadoMatch.aggregate.p1[hoyo],
                            puntoAgg_P2: resultadoMatch.aggregate.p2[hoyo],
                            ganadorAgg
                        });
                    }
                    resultadosFoursome.push(resultadoMatch);
                }
            }
        }
        const premios = {};
        partida.jugadores.forEach(id => {
            premios[id] = 0;
            for(let i=0; i < 18; i++) {
                const scoreBruto = partida.scores[i][id];
                const parHoyo = curso.par[i];
                if (scoreBruto && scoreBruto < parHoyo) {
                    premios[id]++;
                }
            }
        });
        return { resultadosFoursome, premios };
    }

    function calcularTodasLasApuestas(resultadosFoursome, listaJugadores, valorApuestaBase) {
        const apuestasSimples = [];
        const apuestasDobles = [];
        const totalesSimples = { out: {}, in: {} };
        const totalesDobles = {};
        const totalesFinales = {};

        listaJugadores.forEach(id => {
            totalesSimples.out[id] = 0;
            totalesSimples.in[id] = 0;
            totalesDobles[id] = 0;
            totalesFinales[id] = 0;
        });

        const procesarResultado = (score, p1_ids, p2_ids, valor) => {
            const apuesta = {};
            listaJugadores.forEach(id => { apuesta[id] = 0; });
            if (score > 0) {
                p1_ids.forEach(id => { apuesta[id] = valor; });
                p2_ids.forEach(id => { apuesta[id] = -valor; });
            } else if (score < 0) {
                p1_ids.forEach(id => { apuesta[id] = -valor; });
                p2_ids.forEach(id => { apuesta[id] = valor; });
            }
            return apuesta;
        };

        resultadosFoursome.forEach(match => {
            // --- AJUSTE 4: Se obtienen los IDs de las nuevas propiedades, no de la descripción.
            const p1_ids = match.pareja1_ids;
            const p2_ids = match.pareja2_ids;
            // --- FIN DEL AJUSTE ---

            const bbOut = match.bestBall.p1.slice(0, 9).reduce((a, b) => a + b, 0) - match.bestBall.p2.slice(0, 9).reduce((a, b) => a + b, 0);
            const bbIn = match.bestBall.p1.slice(9, 18).reduce((a, b) => a + b, 0) - match.bestBall.p2.slice(9, 18).reduce((a, b) => a + b, 0);
            const bbTotal = bbOut + bbIn;

            const aggOut = match.aggregate.p1.slice(0, 9).reduce((a, b) => a + b, 0) - match.aggregate.p2.slice(0, 9).reduce((a, b) => a + b, 0);
            const aggIn = match.aggregate.p1.slice(9, 18).reduce((a, b) => a + b, 0) - match.aggregate.p2.slice(9, 18).reduce((a, b) => a + b, 0);
            const aggTotal = aggOut + aggIn;

            const apuestasBB_Out = procesarResultado(bbOut, p1_ids, p2_ids, valorApuestaBase);
            const apuestasBB_In = procesarResultado(bbIn, p1_ids, p2_ids, valorApuestaBase);
            const apuestasAgg_Out = procesarResultado(aggOut, p1_ids, p2_ids, valorApuestaBase);
            const apuestasAgg_In = procesarResultado(aggIn, p1_ids, p2_ids, valorApuestaBase);
            
            apuestasSimples.push({
                descripcion: match.descripcion, modalidad: 'Best Ball', outScore: bbOut, inScore: bbIn,
                apuestasOut: apuestasBB_Out, apuestasIn: apuestasBB_In
            });
            apuestasSimples.push({
                descripcion: match.descripcion, modalidad: 'Aggregate', outScore: aggOut, inScore: aggIn,
                apuestasOut: apuestasAgg_Out, apuestasIn: apuestasAgg_In
            });

            const apuestasBB_Doble = procesarResultado(bbTotal, p1_ids, p2_ids, valorApuestaBase * 2);
            const apuestasAgg_Doble = procesarResultado(aggTotal, p1_ids, p2_ids, valorApuestaBase * 2);

            apuestasDobles.push({
                descripcion: match.descripcion, modalidad: 'Best Ball', outScore: bbOut, inScore: bbIn, totalScore: bbTotal,
                apuestas: apuestasBB_Doble
            });
            apuestasDobles.push({
                descripcion: match.descripcion, modalidad: 'Aggregate', outScore: aggOut, inScore: aggIn, totalScore: aggTotal,
                apuestas: apuestasAgg_Doble
            });

            listaJugadores.forEach(id => {
                totalesSimples.out[id] += apuestasBB_Out[id] + apuestasAgg_Out[id];
                totalesSimples.in[id] += apuestasBB_In[id] + apuestasAgg_In[id];
                totalesDobles[id] += apuestasBB_Doble[id] + apuestasAgg_Doble[id];
            });
        });

        listaJugadores.forEach(id => {
            totalesFinales[id] = totalesSimples.out[id] + totalesSimples.in[id] + totalesDobles[id];
        });
        
        return { apuestasSimples, apuestasDobles, totalesSimples, totalesDobles, totalesFinales };
    }
    
    function renderizarResultados(resultados) {
        if (!resultados) {
            contenedorResultadosDiv.innerHTML = '<p>No se pudieron calcular los resultados.</p>';
            return;
        }
        let html = `<h3>Resultados para: ${estadoApp.partidaActual.descripcion}</h3>`;
        if (resultados.resultadosFoursome.length > 0) {
            html += '<h4>Resultados Foursome</h4><table class="tabla-resultados">';
            html += '<thead><tr><th>Match</th><th>Modalidad</th><th>OUT</th><th>IN</th><th>TOTAL</th></tr></thead><tbody>'; 
            
            resultados.resultadosFoursome.forEach(match => {
                const bbOut = match.bestBall.p1.slice(0, 9).reduce((a, b) => a + b, 0) - match.bestBall.p2.slice(0, 9).reduce((a, b) => a + b, 0);
                const bbIn = match.bestBall.p1.slice(9, 18).reduce((a, b) => a + b, 0) - match.bestBall.p2.slice(9, 18).reduce((a, b) => a + b, 0);
                const aggOut = match.aggregate.p1.slice(0, 9).reduce((a, b) => a + b, 0) - match.aggregate.p2.slice(0, 9).reduce((a, b) => a + b, 0);
                const aggIn = match.aggregate.p1.slice(9, 18).reduce((a, b) => a + b, 0) - match.aggregate.p2.slice(9, 18).reduce((a, b) => a + b, 0);
                
                html += `<tr><td rowspan="2">${traducirDescripcionConNombres(match.descripcion)}</td><td>Best Ball</td><td>${bbOut}</td><td>${bbIn}</td><td>${bbOut + bbIn}</td></tr>`;
                html += `<tr><td>Aggregate</td><td>${aggOut}</td><td>${aggIn}</td><td>${aggOut + aggIn}</td></tr>`;
            });
            html += '</tbody></table>';
        }
        html += '<h4>Premios (Birdies o mejor)</h4><table class="tabla-resultados">';
        html += '<thead><tr><th>Jugador</th><th>Total Premios</th></tr></thead><tbody>';
        for (const jugadorId in resultados.premios) {
            const jugadorInfo = jugadores.find(j => j.id == jugadorId);
            html += `<tr><td>${jugadorInfo ? jugadorInfo.nombre : jugadorId}</td><td>${resultados.premios[jugadorId]}</td></tr>`;
        }
        html += '</tbody></table>';
        contenedorResultadosDiv.innerHTML = html;
    }

    function renderizarTablaApuestas(apuestasSimples, listaJugadores, totalesSimples) {
        const headersJugadores = listaJugadores.map(id => {
            const jugador = jugadores.find(j => j.id == id);
            return `<th>${jugador ? jugador.nombre : id}</th>`;
        }).join('');
        let html = `<h4>Apuestas (OUT / IN)</h4>`;
        html += '<div class="tabla-apuestas-wrapper">';
        html += '<table class="tabla-resultados tabla-apuestas">';
        html += `
            <thead>
                <tr>
                    <th rowspan="2">Match</th><th rowspan="2">Modalidad</th><th rowspan="2">OUT</th><th rowspan="2">IN</th>
                    <th colspan="${listaJugadores.length}">APUESTAS OUT</th>
                    <th colspan="${listaJugadores.length}">APUESTAS IN</th>
                </tr>
                <tr>${headersJugadores}${headersJugadores}</tr>
            </thead>
        `;
        html += '<tbody>';
        apuestasSimples.forEach((fila, index) => {
            const esPrimeraFilaDelMatch = index % 2 === 0;
            const celdas = tipo => listaJugadores.map(id => {
                const valor = fila[tipo][id];
                const clase = valor > 0 ? 'apuesta-gana' : (valor < 0 ? 'apuesta-pierde' : '');
                return `<td class="${clase}">${valor !== 0 ? valor : ''}</td>`;
            }).join('');
            
            html += '<tr>';
            if (esPrimeraFilaDelMatch) {
                html += `<td rowspan="2" class="match-cell">${traducirDescripcionConNombres(fila.descripcion)}</td>`;
            }
            html += `<td>${fila.modalidad}</td><td>${fila.outScore}</td><td>${fila.inScore}</td>${celdas('apuestasOut')}${celdas('apuestasIn')}`;
            html += '</tr>';
        });
        html += '</tbody>';
        html += '<tfoot><tr class="total-row">';
        html += '<td colspan="4"><b>TOTAL</b></td>';
        listaJugadores.forEach(id => {
            const valor = totalesSimples.out[id];
            const clase = valor > 0 ? 'apuesta-gana' : (valor < 0 ? 'apuesta-pierde' : '');
            html += `<td class="${clase}"><b>${valor}</b></td>`;
        });
        listaJugadores.forEach(id => {
            const valor = totalesSimples.in[id];
            const clase = valor > 0 ? 'apuesta-gana' : (valor < 0 ? 'apuesta-pierde' : '');
            html += `<td class="${clase}"><b>${valor}</b></td>`;
        });
        html += '</tr></tfoot>';
        html += '</table></div>';
        contenedorApuestasDiv.innerHTML = html;
    }

    function renderizarTablaApuestasDobles(apuestasDobles, listaJugadores, totalesDobles) {
        const headersJugadores = listaJugadores.map(id => {
            const jugador = jugadores.find(j => j.id == id);
            return `<th>${jugador ? jugador.nombre : id}</th>`;
        }).join('');
        let html = `<h4>Apuesta Grande (TOTAL)</h4>`;
        html += '<div class="tabla-apuestas-wrapper">';
        html += '<table class="tabla-resultados tabla-apuestas">';
        html += `
            <thead>
                <tr>
                    <th rowspan="2">Match</th><th rowspan="2">Modalidad</th><th rowspan="2">TOTAL</th>
                    <th colspan="${listaJugadores.length}">APUESTA GRANDE</th>
                </tr>
                <tr>${headersJugadores}</tr>
            </thead>
        `;
        html += '<tbody>';
        apuestasDobles.forEach((fila, index) => {
            const esPrimeraFilaDelMatch = index % 2 === 0;
            const celdas = listaJugadores.map(id => {
                const valor = fila.apuestas[id];
                const clase = valor > 0 ? 'apuesta-gana' : (valor < 0 ? 'apuesta-pierde' : '');
                return `<td class="${clase}">${valor !== 0 ? valor : ''}</td>`;
            }).join('');

            html += '<tr>';
            if (esPrimeraFilaDelMatch) {
                html += `<td rowspan="2" class="match-cell">${traducirDescripcionConNombres(fila.descripcion)}</td>`;
            }
            html += `<td>${fila.modalidad}</td><td>${fila.totalScore}</td>${celdas}`;
            html += '</tr>';
        });
        html += '</tbody>';
        html += '<tfoot><tr class="total-row">';
        html += '<td colspan="3"><b>TOTAL</b></td>';
        listaJugadores.forEach(id => {
            const valor = totalesDobles[id];
            const clase = valor > 0 ? 'apuesta-gana' : (valor < 0 ? 'apuesta-pierde' : '');
            html += `<td class="${clase}"><b>${valor}</b></td>`;
        });
        html += '</tr></tfoot>';
        html += '</table></div>';
        contenedorApuestasDoblesDiv.innerHTML = html;
    }

    function renderizarResumenApuestas(totalesFinales) {
        let html = `<h4>Resultado Final de Apuestas</h4>`;
        html += '<table class="tabla-resultados tabla-resumen-apuestas">';
        html += '<thead><tr><th>Jugador</th><th>Total (U$A)</th></tr></thead><tbody>';
        for (const jugadorId in totalesFinales) {
            const jugadorInfo = jugadores.find(j => j.id == jugadorId);
            const valor = totalesFinales[jugadorId];
            const clase = valor > 0 ? 'apuesta-gana' : (valor < 0 ? 'apuesta-pierde' : '');
            html += `<tr><td>${jugadorInfo ? jugadorInfo.nombre : jugadorId}</td><td class="${clase}">${valor.toFixed(2)}</td></tr>`;
        }
        html += '</tbody></table>';
        contenedorResumenApuestasDiv.innerHTML = html;
    }

    function renderizarDebugView(resultados) {
        if (!resultados || !resultados.resultadosFoursome) {
            contenedorDebugDiv.innerHTML = '';
            return;
        }
        let html = '';
        resultados.resultadosFoursome.forEach(match => {
            // --- AJUSTE 4: Se obtienen los IDs de las nuevas propiedades, no de la descripción.
            const p1_ids = match.pareja1_ids;
            const p2_ids = match.pareja2_ids;
            // --- FIN DEL AJUSTE ---

            html += `<h4>Debug: ${traducirDescripcionConNombres(match.descripcion)} (HDCP Juego: ${match.handicapDeJuego})</h4>`;
            html += '<div class="tabla-debug"><table>';
            html += `<thead><tr>
                <th>Hoyo</th><th>Index</th>
                <th>Neto ${jugadores.find(j=>j.id==p1_ids[0])?.nombre}</th><th>Neto ${jugadores.find(j=>j.id==p1_ids[1])?.nombre}</th><th>BB P1</th>
                <th>Neto ${jugadores.find(j=>j.id==p2_ids[0])?.nombre}</th><th>Neto ${jugadores.find(j=>j.id==p2_ids[1])?.nombre}</th><th>BB P2</th>
                <th>Punto P1</th><th>Punto P2</th><th>Ganador BB</th>
                <th>Agg P1</th><th>Agg P2</th><th>Punto P1</th><th>Punto P2</th><th>Ganador Agg</th>
            </tr></thead><tbody>`;
            for (let i = 0; i < 9; i++) {
                const detalle = match.detallesDebug[i];
                html += `<tr>
                    <td>${detalle.hoyo}</td><td>${detalle.index}</td>
                    <td>${detalle.netoP1J1 ?? '-'}</td><td>${detalle.netoP1J2 ?? '-'}</td><td><b>${detalle.bestBallP1 === Infinity ? '-' : detalle.bestBallP1}</b></td>
                    <td>${detalle.netoP2J1 ?? '-'}</td><td>${detalle.netoP2J2 ?? '-'}</td><td><b>${detalle.bestBallP2 === Infinity ? '-' : detalle.bestBallP2}</b></td>
                    <td>${detalle.puntoBB_P1}</td><td>${detalle.puntoBB_P2}</td><td>${traducirDescripcionConNombres(detalle.ganadorBB)}</td>
                    <td>${detalle.aggregateP1}</td><td>${detalle.aggregateP2}</td><td>${detalle.puntoAgg_P1}</td><td>${detalle.puntoAgg_P2}</td><td>${traducirDescripcionConNombres(detalle.ganadorAgg)}</td>
                </tr>`;
            }
            const out_bb_p1 = match.bestBall.p1.slice(0, 9).reduce((a, b) => a + b, 0);
            const out_bb_p2 = match.bestBall.p2.slice(0, 9).reduce((a, b) => a + b, 0);
            const out_agg_p1 = match.aggregate.p1.slice(0, 9).reduce((a, b) => a + b, 0);
            const out_agg_p2 = match.aggregate.p2.slice(0, 9).reduce((a, b) => a + b, 0);
            html += `<tr class="subtotal-row">
                <td colspan="8"><b>OUT</b></td>
                <td><b>${out_bb_p1}</b></td><td><b>${out_bb_p2}</b></td><td></td>
                <td></td><td></td><td><b>${out_agg_p1}</b></td><td><b>${out_agg_p2}</b></td><td></td>
            </tr>`;
            for (let i = 9; i < 18; i++) {
                const detalle = match.detallesDebug[i];
                html += `<tr>
                    <td>${detalle.hoyo}</td><td>${detalle.index}</td>
                    <td>${detalle.netoP1J1 ?? '-'}</td><td>${detalle.netoP1J2 ?? '-'}</td><td><b>${detalle.bestBallP1 === Infinity ? '-' : detalle.bestBallP1}</b></td>
                    <td>${detalle.netoP2J1 ?? '-'}</td><td>${detalle.netoP2J2 ?? '-'}</td><td><b>${detalle.bestBallP2 === Infinity ? '-' : detalle.bestBallP2}</b></td>
                    <td>${detalle.puntoBB_P1}</td><td>${detalle.puntoBB_P2}</td><td>${traducirDescripcionConNombres(detalle.ganadorBB)}</td>
                    <td>${detalle.aggregateP1}</td><td>${detalle.aggregateP2}</td><td>${detalle.puntoAgg_P1}</td><td>${detalle.puntoAgg_P2}</td><td>${traducirDescripcionConNombres(detalle.ganadorAgg)}</td>
                </tr>`;
            }
            const in_bb_p1 = match.bestBall.p1.slice(9, 18).reduce((a, b) => a + b, 0);
            const in_bb_p2 = match.bestBall.p2.slice(9, 18).reduce((a, b) => a + b, 0);
            const in_agg_p1 = match.aggregate.p1.slice(9, 18).reduce((a, b) => a + b, 0);
            const in_agg_p2 = match.aggregate.p2.slice(9, 18).reduce((a, b) => a + b, 0);
             html += `<tr class="subtotal-row">
                <td colspan="8"><b>IN</b></td>
                <td><b>${in_bb_p1}</b></td><td><b>${in_bb_p2}</b></td><td></td>
                <td></td><td></td><td><b>${in_agg_p1}</b></td><td><b>${in_agg_p2}</b></td><td></td>
            </tr>`;
            const total_bb_p1 = out_bb_p1 + in_bb_p1;
            const total_bb_p2 = out_bb_p2 + in_bb_p2;
            const total_agg_p1 = out_agg_p1 + in_agg_p1;
            const total_agg_p2 = out_agg_p2 + in_agg_p2;
             html += `<tr class="total-row">
                <td colspan="8"><b>TOTAL</b></td>
                <td><b>${total_bb_p1}</b></td><td><b>${total_bb_p2}</b></td><td></td>
                <td></td><td></td><td><b>${total_agg_p1}</b></td><td><b>${total_agg_p2}</b></td><td></td>
            </tr>`;
            html += '</tbody></table></div>';
        });
        contenedorDebugDiv.innerHTML = html;
    }
}
