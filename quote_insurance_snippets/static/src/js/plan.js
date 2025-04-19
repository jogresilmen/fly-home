/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
// Usaremos el método _rpc proporcionado por publicWidget para llamar al backend
import { jsonrpc } from "@web/core/network/rpc_service"; // Alternativa si se llama directamente a una ruta del controlador

publicWidget.registry.PlanPageActions = publicWidget.Widget.extend({
    // Este selector debe dirigirse a un contenedor que exista en tu
    // 'template_pag_plan' y envuelva todas las secciones/botones de producto.
    // '.feature-list.section' parece ser un buen candidato según tu plantilla.
    // Ajusta si es necesario para asegurarte de que identifica de manera única el área.
    selector: '.feature-list.section',
    events: {
        // Escuchar clics en los botones 'Agregar al carrito' dentro del selector objetivo
        'click a.btn-main.btn-main-sm': '_onAddToCartClick',
        // Agregar un listener para los botones de retroceso si existen dentro del alcance del selector
        'click a.redirec': '_onBackClick',
    },

    /**
     * @override
     * Función de inicialización para el widget.
     */
    start: function () {
        console.log("Widget PlanPageActions iniciado para el elemento:", this.el);
        // Los listeners de eventos se adjuntan automáticamente mediante el hash 'events'.
        // No es necesario usar querySelectorAll aquí manualmente.
        return this._super.apply(this, arguments);
    },

    //---------------------------------------------------------------------------
    // Controladores
    //--------------------------------------------------------------------------

    /**
     * Maneja el evento de clic en el botón "Agregar al carrito".
     * @param {Event} ev El objeto del evento de clic.
     */
    _onAddToCartClick: async function (ev) {
        ev.preventDefault(); // Prevenir el comportamiento predeterminado del enlace
        const button = ev.currentTarget;
        const $button = $(button); // Usar jQuery para un acceso más fácil a los atributos de datos

        // Extraer los atributos de datos usando el método .data() de jQuery
        // Nota: .data() maneja automáticamente la conversión de tipo para los números, si es posible,
        // pero el análisis explícito es más seguro. También convierte kebab-case (data-product-id)
        // a camelCase (productId).
        const planId = $button.data('plan-id'); // Lee data-plan-id
        const productId = $button.data('product-id'); // Lee data-product-id
        const productPrice = $button.data('product-price'); // Lee data-product-price

        // Validación básica
        if (!productId) {
            console.error("El ID del producto falta en los atributos de datos del botón.");
            // Podrías mostrar un mensaje de error amigable aquí
            return;
        }
        console.log("Intentando agregar al carrito:", { planId, productId, productPrice });

        try {
            // Usar this._rpc para llamar al método del modelo de Odoo.
            // Esta es la forma estándar en los widgets públicos heredados.
            
          

            await jsonrpc('/shop/cart/update_json_qu',  {
                product_id: productId,
                planId: planId,
                set_qty: 1,
                productPrice: productPrice,
            });

            // Redirigir a la página del carrito al éxito
            window.location.href = "/shop/cart";

        } catch (error) {
            // Registrar cualquier error que ocurra durante la llamada RPC
            console.error("Error al agregar el artículo al carrito:", error);
            // Opcionalmente: Mostrar un mensaje de error amigable al usuario
            // por ejemplo, usando el servicio de notificaciones de Odoo si está disponible/deseado
            // this.displayNotification({ message: 'Error al agregar el artículo al carrito. Por favor, intenta de nuevo.', type: 'danger' });
        }
    },

    /**
     * Maneja el evento de clic en los elementos con la clase 'redirec' (por ejemplo, un botón de retroceso).
     * @param {Event} ev
     */
    _onBackClick: function (ev) {
        ev.preventDefault();
        window.history.back();
    },
});

// Exportar el nombre del widget (opcional, pero es una buena práctica)
export default publicWidget.registry.PlanPageActions;
