/** @odoo-module */

import { Component, onMounted, useState } from "@odoo/owl";
import { patch } from "@web/core/utils/patch";
import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { ProductSerialPopup } from "@sh_pos_product_bundle/js/product_serial_popup"; // Ruta actualizada
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";

patch(Orderline.prototype, {
    setup() {
        super.setup(...arguments);
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
    },

    async onComboIcondeletClick() {
        const order = this.pos.get_order();
        const orderLine = this.props.line;
    
        // Filtrar las líneas que coinciden con el product_tmpl_id_bundle
        const matchingOrderLines = order.orderlines.filter(line => 
            line.product_tmpl_id_bundle === orderLine.product_tmpl_id_bundle
        );
    
        // Iterar sobre las líneas coincidentes
        for (const line of matchingOrderLines) {
            try {
                // Esperar a que se complete la eliminación de la línea
                await order._unlinkOrderline(line);
            } catch (error) {
                console.error('Error al eliminar la línea:', error);
                // Manejar el error si ocurre
            }
        }
    }
    ,

    async onComboIconClick() {
        const product_tmpl_id_bundle = this.props.line.product_tmpl_id_bundle;
        const parentProductId = this.props.line.parent_product_id;
        const productId_Original = this.props.line.productId_Original;
        const orderlineId = this.props.line;
        const nameCombo = this.props.line.nameCombo;
        

        if (parentProductId) {
            const { confirmed, payload } = await this.popup.add(ProductSerialPopup, {
                title: _t("Introduce el serial del producto de cambio"),
                product_tmpl_id_bundle: product_tmpl_id_bundle,
                parentProductId: parentProductId,
                productId_Original: productId_Original,
                qty: this.props.line.qty,
            });

            if (confirmed) {
                console.log(parentProductId, payload, product_tmpl_id_bundle, productId_Original)
                const list = await this.consultSerial(parentProductId, payload, product_tmpl_id_bundle, productId_Original);

                if (list.length > 0) {
                    const order = this.pos.get_order();
                    const orderLine = this.props.line;
                    const originalOrderLine = order.orderlines.find(line => line.id === orderLine.id);
                    

                    for (const item of list) {
                        const newProductId = item.product_id;
                        const newqty = item.qty;
                        if(newqty > 0){
                            await this.updateOrderLineWithNewProduct(newProductId, parentProductId, product_tmpl_id_bundle, productId_Original, nameCombo,newqty);
                        }else{
                            await this.popup.add(ErrorPopup, {
                                title: _t("Cantidad Errada"),
                                body: _t("producto con valor 0 no permitido "),
                            });
                            return false;

                        }
                        
                    }
                    order._unlinkOrderline(originalOrderLine);
                } else {
                    console.log("No products found.");
                }
            }
        }
    },

    async consultSerial(parentProductId, payload, product_tmpl_id_bundle, productId_Original) {
        if (payload.lines && Array.isArray(payload.lines)) {
            const list = []; // Lista para almacenar productos y cantidades
            let totalQuantity = 0;
    
            console.log(payload.lines);
            for (const line of payload.lines) {
                if (line.qty) {
                    totalQuantity += parseFloat(line.qty); 
                    list.push({
                        product_id: line.product_id,
                        qty: line.qty
                    });
                }
            }
            if (totalQuantity > parseInt(this.props.line.qty)) {
                await this.popup.add(ErrorPopup, {
                    title: _t("Cantidad Excedida"),
                    body: _t(`La suma de las cantidades no puede ser superior a ${this.props.line.qty}.`),
                });
                return [];
            } else if (totalQuantity < parseInt(this.props.line.qty)) {
                // Confirmación si la suma es menor a la cantidad permitida
                await this.popup.add(ErrorPopup, {
                    title: _t("Cantidad Faltante"),
                    body: _t(`La suma de las cantidades no puede ser menor a ${this.props.line.qty}.`),
                });
                return [];
            }
    
            
    
           
            return list;
        } else {
            // Manejo de errores si no se encuentran datos válidos
            await this.popup.add(ErrorPopup, {
                title: _t("Datos incorrectos"),
                body: _t("No se encontraron datos válidos en el payload."),
            });
            return [];
        }
    },

    async updateOrderLineWithNewProduct(newProductId, parent_product_id, product_tmpl_id_bundle, productId_Original, nameCombo,newqty) {
        const order = this.pos.get_order();
        if (order) {
            const orderLine = this.props.line;
           
            const product = this.pos.db.get_product_by_id(newProductId);

            if (product) {
                const originalOrderLine = order.orderlines.find(line => line.id === orderLine.id);
                console.log("Línea de Pedido Original:", originalOrderLine);

                if (originalOrderLine) {
                    let combo_option = {
                        'quantity': newqty,
                        'price': originalOrderLine.price,  
                        merge: false,
                    };

                    // Elimina la línea de pedido original
                    // order._unlinkOrderline(originalOrderLine);

                    // Agrega la nueva línea de pedido con el producto actualizado
                    let orderline = await order.add_product(product, combo_option);
                    if (orderline) {
                        // Actualiza el nombre del producto en la línea de pedido
                        let combo_product_name = `${product.display_name} - (${nameCombo})`;
                        orderline.full_product_name = combo_product_name;
                        orderline.price_type = "manual";
                        orderline.parent_product_id = parent_product_id;
                        orderline.product_tmpl_id_bundle = product_tmpl_id_bundle;
                        orderline.productId_Original = productId_Original;
                    }
                }
            }
        }
    }
});
