// Este código se ejecuta solo cuando todo el HTML de la página se ha cargado.
document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // CLASES (MOLDES PARA DATOS)
    // ===================================================================
    class Vuelo {
        constructor(codigo, compania, fechaSalida, horaSalida, fechaLlegada, horaLlegada, precioBase) {
            this.codigo = codigo.toUpperCase();
            this.compania = compania;
            this.fechaSalida = fechaSalida;
            this.horaSalida = horaSalida;
            this.fechaLlegada = fechaLlegada;
            this.horaLlegada = horaLlegada;
            this.precioBase = parseFloat(precioBase) || 0;
            this.actualizarDuracion();
        }

        actualizarDuracion() {
            const salida = new Date(`${this.fechaSalida}T${this.horaSalida}`);
            const llegada = new Date(`${this.fechaLlegada}T${this.horaLlegada}`);
            
            if (isNaN(salida.getTime()) || isNaN(llegada.getTime()) || llegada <= salida) {
                this.duracionVuelo = 'Inválida';
                return false;
            }
            
            let diff = llegada - salida;
            const dias = Math.floor(diff / 86400000); diff -= dias * 86400000;
            const horas = Math.floor(diff / 3600000); diff -= horas * 3600000;
            const minutos = Math.floor(diff / 60000);
            
            this.duracionVuelo = `${dias > 0 ? dias+'d ' : ''}${horas}h ${minutos}m`.trim();
            return true;
        }
    }

    class Aeropuerto {
        constructor(nombre, ciudad) {
            this.nombre = nombre;
            this.ciudad = ciudad;
            this.vuelos = [];
        }

        buscarVueloPorCodigo(codigo) {
            return this.vuelos.find(vuelo => vuelo.codigo.toUpperCase() === codigo.toUpperCase());
        }

        agregarVuelo(vuelo) {
            if (this.buscarVueloPorCodigo(vuelo.codigo)) return false;
            this.vuelos.push(vuelo);
            return true;
        }
        
        modificarVuelo(codigo, datosNuevos) {
            const vueloAModificar = this.buscarVueloPorCodigo(codigo);
            if (!vueloAModificar) return false;
            Object.assign(vueloAModificar, datosNuevos);
            return vueloAModificar.actualizarDuracion();
        }

        eliminarVuelo(codigo) {
            this.vuelos = this.vuelos.filter(vuelo => vuelo.codigo.toUpperCase() !== codigo.toUpperCase());
        }
    }

    // ===================================================================
    // ESTADO Y VARIABLES PRINCIPALES
    // ===================================================================

    const miAeropuerto = new Aeropuerto('Aeropuerto Internacional', 'Ciudad Principal');
    let vueloParaComprar = null;
    let vueloActivoEnFormulario = null;

    // ===================================================================
    // CONEXIÓN CON EL HTML
    // ===================================================================
    const formularioDeVuelos = document.getElementById('formVuelo');
    const { codigo, compania, fecha_salida, hora_salida, fecha_llegada, hora_llegada, precio } = formularioDeVuelos.elements;
    const btnGuardar = document.getElementById('btnGuardar');
    
    const formularioDeCompra = document.getElementById('formCompra');
    const panelDeCompra = document.getElementById('panelCompra');
    const { dni, nombre, email, claseVuelo, comentario } = formularioDeCompra.elements;

    const divListaVuelos = document.getElementById('listaVuelos');
    const divInfoDuracion = document.getElementById('infoDuracion');
    const contadorComentario = document.getElementById('contador');

    // ===================================================================
    // FUNCIONES DE UTILIDAD (VALIDACIÓN Y MANEJO DEL DOM)
    // ===================================================================

    const validarCodigoVuelo = (textoCodigo) => /^[A-Z]{3}\d{4}$/i.test(textoCodigo);
    const validarDNI = (textoDNI) => { const r=/^\d{8}[A-Z]$/i; if(!r.test(textoDNI)) return false; return 'TRWAGMYFPDXBNJZSQVHLCKE'.charAt(textoDNI.substr(0,8)%23)===textoDNI.substr(8,1).toUpperCase(); };
    const validarEmail = (textoEmail) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textoEmail);

    function mostrarError(campoInput, mensajeDeError) {
        const grupoDelFormulario = campoInput.closest('.grupo-form');
        if (grupoDelFormulario) {
            const contenedorDelError = grupoDelFormulario.querySelector('.error-message');
            campoInput.classList.add('input-error');
            if(contenedorDelError) {
                contenedorDelError.textContent = mensajeDeError;
            }
        }
    }

    function limpiarError(campoInput) {
        const grupoDelFormulario = campoInput.closest('.grupo-form');
        if (grupoDelFormulario) {
            const contenedorDelError = grupoDelFormulario.querySelector('.error-message');
            campoInput.classList.remove('input-error');
            if(contenedorDelError) {
                contenedorDelError.textContent = '';
            }
        }
    }
    const limpiarTodosLosErrores = (formulario) => {
        formulario.querySelectorAll('.input-error').forEach(campoConError => limpiarError(campoConError));
    };

    const guardarVuelosEnMemoria = () => localStorage.setItem('vuelosAeropuerto', JSON.stringify(miAeropuerto.vuelos));
    
    const cargarVuelosDesdeMemoria = () => { 
        const vuelosGuardados = JSON.parse(localStorage.getItem('vuelosAeropuerto')); 
        if (vuelosGuardados && Array.isArray(vuelosGuardados) && vuelosGuardados.length > 0) {
            miAeropuerto.vuelos = vuelosGuardados.map(v => new Vuelo(v.codigo, v.compania, v.fechaSalida, v.horaSalida, v.fechaLlegada, v.horaLlegada, v.precioBase)); 
        } else {
            miAeropuerto.agregarVuelo(new Vuelo('IBE0001', 'Iberia', '2025-10-20', '10:00', '2025-10-20', '12:15', 180.50));
            miAeropuerto.agregarVuelo(new Vuelo('RYN8765', 'Ryanair', '2025-11-05', '09:30', '2025-11-05', '11:40', 89.99));
        } 
    };
    
    const actualizarInfoCabecera = () => { document.getElementById('nombreAeropuerto').innerHTML = `✈️ Gestor de Vuelos`; };
    
    const formatearFechaHora = (fecha, hora) => new Date(`${fecha}T${hora}`).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // ===================================================================
    // RENDERIZADO Y ACTUALIZACIÓN DE LA PÁGINA
    // ===================================================================
    
    const renderizarListaDeVuelos = (listaDeVuelos = miAeropuerto.vuelos) => {
        divListaVuelos.innerHTML = '';
        document.getElementById('infoAeropuerto').textContent = `Vuelos diarios: ${listaDeVuelos.length}`;
        
        if (listaDeVuelos.length === 0) {
            divListaVuelos.innerHTML = '<p>🤷‍♂️ No se encontraron vuelos.</p>';
            return;
        }

        listaDeVuelos.forEach(vuelo => {
            const vueloHTML = `
                <div class="vuelo-item ${vueloActivoEnFormulario === vuelo.codigo ? 'activo' : ''}" data-codigo="${vuelo.codigo}">
                    <div>
                        <strong>✈️ ${vuelo.codigo}</strong> (${vuelo.compania})<br>
                        <small>🛫 Salida: ${formatearFechaHora(vuelo.fechaSalida, vuelo.horaSalida)} | 🛬 Llegada: ${formatearFechaHora(vuelo.fechaLlegada, vuelo.horaLlegada)}</small><br>
                        <small>⏱️ Duración: ${vuelo.duracionVuelo} | 💶 Precio Base: ${vuelo.precioBase.toFixed(2)}€</small>
                    </div>
                    <div class="vuelo-item-controles">
                        <button class="boton boton-mostrar" data-accion="modificar">📝 Modificar</button>
                        <button class="boton boton-guardar" data-accion="comprar">🛒 Comprar</button>
                    </div>
                </div>`;
            divListaVuelos.insertAdjacentHTML('beforeend', vueloHTML);
        });
    };

    const actualizarDuracionEnTiempoReal = () => {
        const [fS, hS, fL, hL] = [fecha_salida.value, hora_salida.value, fecha_llegada.value, hora_llegada.value];
        if (!fS || !hS || !fL || !hL) {
            divInfoDuracion.textContent = 'Introduce fechas y horas para calcular';
            return;
        }
        const tempVuelo = new Vuelo('temp', 'temp', fS, hS, fL, hL, 0);
        divInfoDuracion.textContent = `Duración Estimada: ${tempVuelo.duracionVuelo}`;
        divInfoDuracion.style.color = tempVuelo.duracionVuelo === 'Inválida' ? 'red' : '';
    };

    // ===================================================================
    // MANEJADORES DE EVENTOS PRINCIPALES
    // ===================================================================

    const manejarGuardado = (evento) => {
        evento.preventDefault();
        limpiarTodosLosErrores(formularioDeVuelos);

        if (!validarCodigoVuelo(codigo.value.trim())) {
            mostrarError(codigo, 'Formato incorrecto (ej: IBE1234).');
            return;
        }
        
        const datosFormulario = { compania: compania.value.trim(), fechaSalida: fecha_salida.value, horaSalida: hora_salida.value, fechaLlegada: fecha_llegada.value, horaLlegada: hora_llegada.value, precioBase: precio.value };
        if (Object.values(datosFormulario).some(val => !val)) {
            alert('⚠️ Para guardar, todos los campos son obligatorios.');
            return;
        }
        
        const codigoVuelo = codigo.value.trim().toUpperCase();
        const vueloExistente = miAeropuerto.buscarVueloPorCodigo(codigoVuelo);

        if (vueloExistente) {
            miAeropuerto.modificarVuelo(codigoVuelo, datosFormulario);
        } else {
            miAeropuerto.agregarVuelo(new Vuelo(codigoVuelo, ...Object.values(datosFormulario)));
        }
        
        formularioDeVuelos.reset();
        btnGuardar.textContent = '💾 Guardar';
        vueloActivoEnFormulario = null;
        actualizarDuracionEnTiempoReal();
        guardarVuelosEnMemoria();
        renderizarListaDeVuelos();
    };
    
    const manejarMostrar = () => {
        const codigoFiltro = codigo.value.trim().toUpperCase();
        const companiaFiltro = compania.value.trim().toLowerCase();

        if (!codigoFiltro && !companiaFiltro) {
            renderizarListaDeVuelos(miAeropuerto.vuelos);
            return;
        }

        const vuelosFiltrados = miAeropuerto.vuelos.filter(vuelo => {
            const matchCodigo = codigoFiltro ? vuelo.codigo.toUpperCase().includes(codigoFiltro) : true;
            const matchCompania = companiaFiltro ? vuelo.compania.toLowerCase().includes(companiaFiltro) : true;
            return matchCodigo && matchCompania;
        });

        renderizarListaDeVuelos(vuelosFiltrados);
    };

    const manejarCargaVueloEnFormulario = (codigoDelVuelo) => {
        const vuelo = miAeropuerto.buscarVueloPorCodigo(codigoDelVuelo);
        if(vuelo) {
            codigo.value = vuelo.codigo;
            compania.value = vuelo.compania;
            fecha_salida.value = vuelo.fechaSalida;
            hora_salida.value = vuelo.horaSalida;
            fecha_llegada.value = vuelo.fechaLlegada;
            hora_llegada.value = vuelo.horaLlegada;
            precio.value = vuelo.precioBase;
            
            btnGuardar.textContent = '💾 Actualizar Vuelo';
            vueloActivoEnFormulario = vuelo.codigo;
            actualizarDuracionEnTiempoReal();
            renderizarListaDeVuelos();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    };
    
    const manejarClickListaVuelos = (evento) => {
        const botonPulsado = evento.target.closest('button');
        if(!botonPulsado) return;

        const codigoVuelo = botonPulsado.closest('.vuelo-item').dataset.codigo;
        const accion = botonPulsado.dataset.accion;

        if (accion === 'modificar') manejarCargaVueloEnFormulario(codigoVuelo);
        
        if (accion === 'comprar') {
            vueloParaComprar = miAeropuerto.buscarVueloPorCodigo(codigoVuelo);
            if(vueloParaComprar) {
                document.getElementById('infoVueloCompra').innerHTML = `💳 Comprando billete para el vuelo <strong>${vueloParaComprar.codigo}</strong> (${vueloParaComprar.compania})`;
                panelDeCompra.classList.remove('panel-oculto');
                formularioDeCompra.reset();
                limpiarTodosLosErrores(formularioDeCompra);
                claseVuelo.dispatchEvent(new Event('change')); 
                comentario.dispatchEvent(new Event('input'));
            }
        }
    };
    
    const manejarConfirmacionCompra = (evento) => {
        evento.preventDefault();
        limpiarTodosLosErrores(formularioDeCompra);
        
        let esFormularioValido = true;
        const metodoPago = document.querySelector('input[name="metodoPago"]:checked');
        
        if (!dni.value.trim()) {
            mostrarError(dni, 'Este campo es obligatorio.');
            esFormularioValido = false;
        } else if (!validarDNI(dni.value.trim())) {
            mostrarError(dni, 'Formato de DNI incorrecto.');
            esFormularioValido = false;
        }
        
        if (!nombre.value.trim()) {
            mostrarError(nombre, 'Este campo es obligatorio.');
            esFormularioValido = false;
        }

        if (!email.value.trim()) {
            mostrarError(email, 'Este campo es obligatorio.');
            esFormularioValido = false;
        } else if (!validarEmail(email.value.trim())) {
            mostrarError(email, 'Formato de correo electrónico incorrecto.');
            esFormularioValido = false;
        }

        if (!metodoPago) {
            mostrarError(document.querySelector('.opciones-pago'), 'Debe seleccionar un método de pago.');
            esFormularioValido = false;
        }
        
        if (!esFormularioValido) return;

        const precioFinal = (vueloParaComprar.precioBase * claseVuelo.value).toFixed(2);
        const mensajeDeConfirmacion = `¿Confirma la reserva?\n\n✈️ Vuelo: ${vueloParaComprar.codigo}\n👤 Pasajero: ${nombre.value.trim()}\n💶 Precio Final: ${precioFinal}€`;
        
        if (confirm(mensajeDeConfirmacion)) {
            alert('✅ ¡Reserva realizada con éxito! ¡Disfrute de su vuelo! ✈️');
            panelDeCompra.classList.add('panel-oculto');
        } else {
            alert('ℹ️ Reserva cancelada por el usuario.');
        }
    };

    // ===================================================================
    // INICIALIZACIÓN DE EVENTOS Y CARGA INICIAL
    // ===================================================================
    const inicializarInterfaz = () => {
        // Añadir emojis a los títulos estáticos del HTML
        document.querySelector('.columna-izquierda h2').innerHTML = '📝 Administrar Vuelos';
        document.querySelector('.columna-derecha h2').innerHTML = '📋 Vuelos Programados';
        document.getElementById('tituloCompra').innerHTML = '💳 Comprar Billete';

        formularioDeVuelos.addEventListener('submit', manejarGuardado);
        document.getElementById('btnMostrar').addEventListener('click', manejarMostrar);
        [fecha_salida, hora_salida, fecha_llegada, hora_llegada].forEach(input => input.addEventListener('input', actualizarDuracionEnTiempoReal));
        
        divListaVuelos.addEventListener('click', manejarClickListaVuelos);
        formularioDeCompra.addEventListener('submit', manejarConfirmacionCompra);
        document.getElementById('btnCancelarCompra').addEventListener('click', () => panelDeCompra.classList.add('panel-oculto'));
        
        claseVuelo.addEventListener('change', () => { 
            if (vueloParaComprar) { 
                document.getElementById('precioFinal').innerText = `Precio a pagar: ${(vueloParaComprar.precioBase * claseVuelo.value).toFixed(2)}€`; 
            } 
        });
        
        comentario.addEventListener('input', (e) => { 
            contadorComentario.innerText = `${e.target.maxLength - e.target.value.length} caracteres restantes`; 
        });
        
        [dni, nombre, email].forEach(input => {
            input.addEventListener('input', () => limpiarError(input));
        });
        document.querySelectorAll('input[name="metodoPago"]').forEach(radio => {
            radio.addEventListener('change', () => limpiarError(document.querySelector('.opciones-pago')));
        });
        
        // --- Carga Inicial ---
        cargarVuelosDesdeMemoria();
        renderizarListaDeVuelos();
        actualizarInfoCabecera();
    };

    inicializarInterfaz();
});
