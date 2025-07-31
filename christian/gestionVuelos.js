// Este código se ejecuta solo cuando todo el HTML de la página se ha cargado.
document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // PARTE 1: DEFINIR LOS MOLDES PARA NUESTROS DATOS (CLASES)
    // ===================================================================

    class Vuelo {
        constructor(codigo, compania, fechaSalida, horaSalida, fechaLlegada, horaLlegada, precioBase) {
            this.codigo = codigo;
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
            
            let diferenciaEnMilisegundos = llegada - salida;
            const dias = Math.floor(diferenciaEnMilisegundos / 86400000);
            diferenciaEnMilisegundos -= (dias * 86400000);
            const horas = Math.floor(diferenciaEnMilisegundos / 3600000);
            diferenciaEnMilisegundos -= (horas * 3600000);
            const minutos = Math.floor(diferenciaEnMilisegundos / 60000);
            
            let textoDuracion = '';
            if (dias > 0) textoDuracion += `${dias}d `;
            textoDuracion += `${horas}h ${minutos}m`;
            this.duracionVuelo = textoDuracion.trim();
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

            Object.keys(datosNuevos).forEach(key => {
                if (datosNuevos[key] || typeof datosNuevos[key] === 'number') {
                    vueloAModificar[key] = (key === 'precioBase') ? parseFloat(datosNuevos[key]) : datosNuevos[key];
                }
            });
            return vueloAModificar.actualizarDuracion();
        }

        eliminarVuelo(codigo) {
            this.vuelos = this.vuelos.filter(vuelo => vuelo.codigo.toUpperCase() !== codigo.toUpperCase());
        }
    }

    // ===================================================================
    // PARTE 2: ESTADO Y VARIABLES PRINCIPALES
    // ===================================================================

    const miAeropuerto = new Aeropuerto('Aeropuerto Internacional', 'Ciudad Principal');
    // <<< ESTA VARIABLE ES CLAVE PARA EL PROCESO DE COMPRA >>>
    let vueloParaComprar = null;

    // ===================================================================
    // PARTE 3: CONECTAR JAVASCRIPT CON EL HTML
    // ===================================================================

    const formularioDeVuelos = document.getElementById('formVuelo');
    const { codigo, compania, fecha_salida, hora_salida, fecha_llegada, hora_llegada, precio } = formularioDeVuelos.elements;
    
    // <<< ESTOS ELEMENTOS SON PARA EL PANEL DE COMPRA >>>
    const formularioDeCompra = document.getElementById('formCompra');
    const panelDeCompra = document.getElementById('panelCompra');
    
    const divListaVuelos = document.getElementById('listaVuelos');
    const divInfoDuracion = document.getElementById('infoDuracion');
    
    // ===================================================================
    // PARTE 4: FUNCIONES REUTILIZABLES (HERRAMIENTAS)
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
                contenedorDelError.style.display = 'block';
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
                contenedorDelError.style.display = 'none';
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
            miAeropuerto.agregarVuelo(new Vuelo('VLG2345', 'Vueling', '2025-11-15', '18:00', '2025-11-15', '19:20', 110.00));
            guardarVuelosEnMemoria();
        } 
    };
    
    const actualizarInfoCabecera = () => { document.getElementById('nombreAeropuerto').textContent = `✈️ ${miAeropuerto.nombre} (${miAeropuerto.ciudad})`; };
    
    const formatearFechaHora = (fecha, hora) => { 
        if (!fecha || !hora) return 'Fecha/hora no disponible';
        return new Date(`${fecha}T${hora}`).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    
    const renderizarListaDeVuelos = (listaDeVuelos) => {
        divListaVuelos.innerHTML = '';
        const numeroVuelosMostrados = (listaDeVuelos && Array.isArray(listaDeVuelos)) ? listaDeVuelos.length : 0;
        document.getElementById('infoAeropuerto').textContent = `Vuelos diarios: ${numeroVuelosMostrados}`;
        
        if (numeroVuelosMostrados === 0) {
            divListaVuelos.innerHTML = '<p>No se encontraron vuelos con los criterios de búsqueda.</p>';
            return;
        }

        listaDeVuelos.forEach(vuelo => {
            const vueloHTML = `
                <div class="vuelo-item">
                    <div>
                        <strong>${vuelo.codigo}</strong> (${vuelo.compania})<br>
                        <small>Salida: ${formatearFechaHora(vuelo.fechaSalida, vuelo.horaSalida)} | Llegada: ${formatearFechaHora(vuelo.fechaLlegada, vuelo.horaLlegada)}</small><br>
                        <small>Duración: ${vuelo.duracionVuelo} | Precio Base: ${vuelo.precioBase.toFixed(2)}€</small>
                    </div>
                    <div class="vuelo-item-controles">
                        <button class="boton boton-buscar boton-cargar-lista" data-codigo="${vuelo.codigo}">📝 Modificar</button>
                        <button class="boton boton-comprar" data-codigo="${vuelo.codigo}">🛒 Comprar</button>
                    </div>
                </div>`;
            divListaVuelos.innerHTML += vueloHTML;
        });
    };

    const actualizarTodaLaPagina = () => {
        renderizarListaDeVuelos(miAeropuerto.vuelos);
        actualizarInfoCabecera();
    };

    const actualizarDuracionEnTiempoReal = () => {
        const [fechaSalida, horaSalida, fechaLlegada, horaLlegada] = [fecha_salida.value, hora_salida.value, fecha_llegada.value, hora_llegada.value];
    
        if (!fechaSalida || !horaSalida || !fechaLlegada || !horaLlegada) {
            divInfoDuracion.textContent = 'Duración Estimada: --';
            divInfoDuracion.style.color = '';
            return;
        }
        
        const salida = new Date(`${fechaSalida}T${horaSalida}`);
        const llegada = new Date(`${fechaLlegada}T${horaLlegada}`);
    
        if (isNaN(salida.getTime()) || isNaN(llegada.getTime()) || llegada <= salida) {
            divInfoDuracion.textContent = 'Duración Estimada: Cálculo inválido';
            divInfoDuracion.style.color = 'red';
            return;
        }
    
        divInfoDuracion.style.color = ''; 
        let diferenciaEnMilisegundos = llegada - salida;
        const dias = Math.floor(diferenciaEnMilisegundos / 86400000);
        diferenciaEnMilisegundos -= (dias * 86400000);
        const horas = Math.floor(diferenciaEnMilisegundos / 3600000);
        diferenciaEnMilisegundos -= (horas * 3600000);
        const minutos = Math.floor(diferenciaEnMilisegundos / 60000);
        
        let textoDuracion = '';
        if (dias > 0) textoDuracion += `${dias}d `;
        textoDuracion += `${horas}h ${minutos}m`;
        divInfoDuracion.textContent = `Duración Estimada: ${textoDuracion.trim()}`;
    };

    // ===================================================================
    // PARTE 5: LÓGICA PRINCIPAL (MANEJADORES DE EVENTOS)
    // ===================================================================

    const manejarGuardado = (evento) => {
        evento.preventDefault();
        limpiarTodosLosErrores(formularioDeVuelos);

        const codigoVuelo = codigo.value.trim().toUpperCase();
        if (!validarCodigoVuelo(codigoVuelo)) {
            if (codigo.value) mostrarError(codigo, 'Formato incorrecto (ej: IBE1234).');
            return;
        }

        const vueloExistente = miAeropuerto.buscarVueloPorCodigo(codigoVuelo);
        const datosFormulario = { compania: compania.value.trim(), fechaSalida: fecha_salida.value, horaSalida: hora_salida.value, fechaLlegada: fecha_llegada.value, horaLlegada: hora_llegada.value, precioBase: precio.value };

        if (vueloExistente) {
            if (!miAeropuerto.modificarVuelo(codigoVuelo, datosFormulario)) {
                 return alert('Error al modificar: La fecha de llegada debe ser posterior a la de salida.');
            }
            alert(`Vuelo ${codigoVuelo} modificado correctamente.`);
        } else {
            if (!datosFormulario.compania || !datosFormulario.fechaSalida || !datosFormulario.horaSalida || !datosFormulario.fechaLlegada || !datosFormulario.horaLlegada || !datosFormulario.precioBase) {
                return alert('Para crear un vuelo nuevo, todos los campos son obligatorios.');
            }
            const nuevoVuelo = new Vuelo(codigoVuelo, ...Object.values(datosFormulario));
            if (nuevoVuelo.duracionVuelo === 'Inválida') {
                return alert('Error al crear: La fecha de llegada debe ser posterior a la de salida.');
            }
            miAeropuerto.agregarVuelo(nuevoVuelo);
            alert(`Vuelo ${codigoVuelo} guardado correctamente.`);
        }
        
        formularioDeVuelos.reset();
        actualizarDuracionEnTiempoReal();
        guardarVuelosEnMemoria();
    };
    
    const manejarMostrarVuelos = () => {
        const codigoFiltro = codigo.value.trim().toUpperCase();
        const companiaFiltro = compania.value.trim().toLowerCase();
        
        if (!codigoFiltro && !companiaFiltro) {
            renderizarListaDeVuelos(miAeropuerto.vuelos);
            return;
        }
        
        let vuelosFiltrados = [...miAeropuerto.vuelos]; 
        if (codigoFiltro) {
            vuelosFiltrados = vuelosFiltrados.filter(vuelo => vuelo.codigo.toUpperCase().includes(codigoFiltro));
        }
        if (companiaFiltro) {
            vuelosFiltrados = vuelosFiltrados.filter(vuelo => vuelo.compania.toLowerCase().includes(companiaFiltro));
        }
        
        renderizarListaDeVuelos(vuelosFiltrados);
    };

    const manejarCargaDesdeLista = (codigoDelVuelo) => {
        const vuelo = miAeropuerto.buscarVueloPorCodigo(codigoDelVuelo);
        if(vuelo) {
            codigo.value = vuelo.codigo;
            compania.value = vuelo.compania;
            fecha_salida.value = vuelo.fechaSalida;
            hora_salida.value = vuelo.horaSalida;
            fecha_llegada.value = vuelo.fechaLlegada;
            hora_llegada.value = vuelo.horaLlegada;
            precio.value = vuelo.precioBase;

            actualizarDuracionEnTiempoReal();
            window.scrollTo(0, 0);
        }
    };
    
    // <<< ESTA FUNCIÓN GESTIONA EL CLIC EN EL BOTÓN "COMPRAR" DE LA LISTA >>>
    const manejarClickListaVuelos = (evento) => {
        const botonPulsado = evento.target;
        const codigoVuelo = botonPulsado.dataset.codigo;
        if(!codigoVuelo) return;

        if(botonPulsado.classList.contains('boton-cargar-lista')) {
            manejarCargaDesdeLista(codigoVuelo);
        }
        
        // <<< AQUÍ COMIENZA LA LÓGICA DE COMPRA >>>
        if(botonPulsado.classList.contains('boton-comprar')) {
            vueloParaComprar = miAeropuerto.buscarVueloPorCodigo(codigoVuelo);
            if(vueloParaComprar) {
                document.getElementById('infoVueloCompra').innerText = `Comprando vuelo ${vueloParaComprar.codigo} (${vueloParaComprar.compania})`;
                formularioDeCompra.elements.claseVuelo.dispatchEvent(new Event('change'));
                panelDeCompra.classList.remove('panel-oculto');
                limpiarTodosLosErrores(formularioDeCompra);
            }
        }
    };
    
    // <<< ESTA FUNCIÓN CONFIRMA LA COMPRA Y ELIMINA EL VUELO >>>
    const manejarConfirmacionCompra = (evento) => {
        evento.preventDefault();
        limpiarTodosLosErrores(formularioDeCompra);
        let formularioEsValido = true;
        
        const { dni, nombre, email, claseVuelo } = formularioDeCompra.elements;
        const metodoPago = document.querySelector('input[name="metodoPago"]:checked');
        
        if (!dni.value) { mostrarError(dni, 'El DNI es obligatorio.'); formularioEsValido = false; }
        else if (!validarDNI(dni.value)) { mostrarError(dni, 'Formato de DNI incorrecto.'); formularioEsValido = false; }
        
        if (!nombre.value.trim()) { mostrarError(nombre, 'El nombre es obligatorio.'); formularioEsValido = false; }
        
        if (!email.value) { mostrarError(email, 'El correo es obligatorio.'); formularioEsValido = false; }
        else if (!validarEmail(email.value)) { mostrarError(email, 'Formato de correo incorrecto.'); formularioEsValido = false; }
        
        if (!metodoPago) { mostrarError(document.querySelector('.opciones-pago'), 'Debe seleccionar un método de pago.'); formularioEsValido = false; }
        
        if (!formularioEsValido) return;

        const precioFinal = (vueloParaComprar.precioBase * claseVuelo.value).toFixed(2);
        const mensajeDeConfirmacion = `¿Confirma la reserva?\n\n- Vuelo: ${vueloParaComprar.codigo}\n- Precio: ${precioFinal}€\n- Pasajero: ${nombre.value.trim()}`;
        
        if (confirm(mensajeDeConfirmacion)) {
            miAeropuerto.eliminarVuelo(vueloParaComprar.codigo);
            guardarVuelosEnMemoria();
            actualizarTodaLaPagina();
            alert('¡Reserva realizada con éxito!');
            panelDeCompra.classList.add('panel-oculto');
            formularioDeCompra.reset();
        } else {
            alert('Reserva cancelada.');
        }
    };

    // ===================================================================
    // PARTE 6: INICIALIZACIÓN DE LA APLICACIÓN
    // ===================================================================

    formularioDeVuelos.addEventListener('submit', manejarGuardado);
    document.getElementById('btnMostrar').addEventListener('click', manejarMostrarVuelos);
    [fecha_salida, hora_salida, fecha_llegada, hora_llegada].forEach(input => input.addEventListener('input', actualizarDuracionEnTiempoReal));
    
    // <<< ESTOS SON LOS EVENTOS QUE HACEN FUNCIONAR LA COMPRA >>>
    divListaVuelos.addEventListener('click', manejarClickListaVuelos);
    formularioDeCompra.addEventListener('submit', manejarConfirmacionCompra);
    document.getElementById('btnCancelarCompra').addEventListener('click', () => { panelDeCompra.classList.add('panel-oculto'); formularioDeCompra.reset(); limpiarTodosLosErrores(formularioDeCompra); });
    formularioDeCompra.elements.claseVuelo.addEventListener('change', () => { if (vueloParaComprar) { document.getElementById('precioFinal').innerText = `Precio a pagar: ${(vueloParaComprar.precioBase * formularioDeCompra.elements.claseVuelo.value).toFixed(2)}€`; } });
    
    formularioDeCompra.elements.comentario.addEventListener('input', (e) => { document.getElementById('contador').innerText = `${e.target.maxLength - e.target.value.length} caracteres restantes`; });
    
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => limpiarError(input));
        input.addEventListener('change', () => limpiarError(input));
    });
    
    // --- Carga Inicial ---
    cargarVuelosDesdeMemoria();
    actualizarTodaLaPagina();
    actualizarDuracionEnTiempoReal();
});
