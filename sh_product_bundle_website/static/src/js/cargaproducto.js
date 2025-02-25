/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import wSaleUtils from "@website_sale/js/website_sale_utils";

const LoadOptionalProducts = publicWidget.Widget.extend({
    selector: '.o_optional_product_select',

    /**
     * @override
     */
    start: function () {
        var self = this;
        this._super.apply(this, arguments);

        // Cargar productos opcionales al iniciar
        this.loadOptionalProducts();
    },

    /**
     * Cargar los productos opcionales usando el product_id.
     */
    loadOptionalProducts: function () {
        var self = this;

        this.$el.each(function () {
            var $select = $(this);
            var product_id = $select.data('product-id');
            var line_id = $select.data('line-id');
            var qty = $select.data('qty-id');
            var $input = $select.siblings('.o_optional_product_input');
            var $link = $select.siblings('.o_change_product');
            console.log(product_id);

            if (product_id) {
                $.ajax({
                    url: '/shop/get_optional_products',
                    type: 'GET',
                    data: { product_id: product_id }, // Envía el `product_id`
                    success: function (data) {
                        const optional_products = data.optional_products;
                        const tag = data.tag;

                        if (optional_products.length === 1) {
                            // Si solo hay un producto opcional, cambia a un input readonly
                            $input.val(optional_products[0].name);
                            $input.removeClass('d-none');
                            $select.addClass('d-none');
                        } else if (optional_products.length > 1) {
                            // Si hay más de un producto, mantener el select y llenar las opciones
                            $select.empty();
                            $.each(optional_products, function (index, product) {
                                $select.append(new Option(product.name, product.id));
                            });
                            $link.removeClass('d-none');

                            // Asociar evento de click al link para duplicar la línea del producto
                            $link.on('click', function (e) {
                                e.preventDefault();
                                
                                self.openProductModal(line_id, optional_products,qty,product_id);
                            });
                        } else {
                            // Si no hay productos opcionales, mantener la configuración por defecto
                            $select.addClass('d-none');
                        }
                    },
                    error: function (error) {
                        console.error('Error al cargar los productos opcionales:', error);
                    }
                });
            }
        });
    },

    /**
     * Función para duplicar la línea del producto.
     */
    openProductModal: function (line_id, optional_products,qty,product_id) {
        var self = this;
        
        var $modal = $('#productSelectionModal');
        var $select = $modal.find('#productSelectModal');
        
        $select.empty();
        $.each(optional_products, function (index, product) {
            $select.append(new Option(product.name, product.id));
        });

        // Guardar el ID de la línea en el modal
        $modal.data('line-id', line_id);

        $modal.modal('show');

        // Manejar el clic en el botón "Agregar"
        $('#addProductButton').off('click').on('click', function () {
            var selectedProductId = $select.val();
            if (selectedProductId) {
                self.duplicateProductLine(line_id, selectedProductId, qty, product_id);
            }
        });
    },


    duplicateProductLine: function (line_id, new_product_id, qty, product_id) {
        var self = this;
        console.log({ 
            line_id: line_id, 
            new_product_id: new_product_id,
            qty: qty,
            product_id: product_id,
         })
        $.ajax({
            url: '/shop/cart/duplicate_product_line',
            type: 'GET',
            data: { 
                line_id: line_id, 
                new_product_id: new_product_id,
                qty: qty,
                product_id: product_id,
             },
            success: function (data) {
                console.log(data.status)
                if (data.status === 'success') {
                    location.reload();
                } else {
                    console.error('Error:', data.message);
                }
            },
            error: function (error) {
                console.error('Error al duplicar la línea del producto:', error);
            }
        });
    }
});

publicWidget.registry.LoadOptionalProducts = LoadOptionalProducts;

export default LoadOptionalProducts;
