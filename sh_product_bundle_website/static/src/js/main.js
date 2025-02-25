/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import wSaleUtils from "@website_sale/js/website_sale_utils";

const UpdateCartLine = publicWidget.Widget.extend({
    selector: '.o_optional_product_select',

    /**
     * @override
     */
    start: function () {
        var self = this;
        this._super.apply(this, arguments);

        this.$el.on('change', function (ev) {
            var selectedOption = $(this).find('option:selected');
            var line_id = $(this).data('line-id');
            var line_product_id = selectedOption.val();
            
            // Llama al método para actualizar la línea de pedido
            self._rpcUpdateCartLine(line_id, line_product_id);
        });
    },

    /**
     * Método privado para actualizar la línea de pedido.
     *
     * @private
     * @param {number} line_id - ID de la línea de pedido
     * @param {number} line_product_id - ID del producto de la línea de pedido
     */
    _rpcUpdateCartLine: function (line_id, line_product_id) {
        var self = this;
        // Realiza una solicitud GET
        $.ajax({
            url: '/update_cart_line',
            type: 'GET',
            data: {
                product_id: line_product_id,
                line_id: line_id,
                add_qty: 1,
                display: false
            },
            success: function (data) {
                console.log('Línea de orden actualizada:', data);
                if (data.status === 'success') {
                    // Actualizar la interfaz de usuario si es necesario
                    location.reload();
                } else {
                    console.error('Error:', data.message);
                }
            },
            error: function (error) {
                console.error('Error al actualizar la línea de orden:', error);
                // Manejar errores si es necesario
            }
        });
    },
});

publicWidget.registry.UpdateCartLine = UpdateCartLine;

export default UpdateCartLine;
