/** @odoo-module */


import { Orderline, Order } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

// Parchear la clase Order para agregar funcionalidades adicionales
patch(Order.prototype, {
    
    // Método setup que se ejecuta al inicializar una orden
    setup() {
        // Llamar al método setup original de la clase Order
        super.setup(...arguments);
        // Inicializar el contador de combos a 0
        this.sh_combo_count = 0;
    },
    // Método para remover productos de un combo dado un identificador de combo
    remove_combo_product(sh_combo_count) {
        var self = this;
        // Iterar sobre todas las líneas de orden
        [...this.get_orderlines()].map(async(line) => {
            // Si el identificador de combo no es 0 y la línea pertenece al combo
            if (sh_combo_count != 0 && line.sh_combo_count == sh_combo_count) {
                // Remover la línea de la orden
                await self.pos.get_order().removeOrderline(line);
            }
        });
    },
    // Método para actualizar la cantidad de productos en un combo
    update_combo_qty(sh_combo_count, quantity, parent_line) {
        var self = this;
        // Iterar sobre todas las líneas de orden
        [...this.get_orderlines()].map(async(line) => {
            // Si el identificador de combo no es 0, la línea no es la principal y pertenece al combo
            if (sh_combo_count != 0 && parent_line.cid != line.cid && line.sh_combo_count == sh_combo_count) {
                // Actualizar la cantidad de la línea y poner el precio a 0
                await line.set_quantity(line.quantity * quantity);
                await line.set_unit_price(0);
            }
        });
    },
    // Método de prueba para actualizar productos (no implementado)
    updateProducts(event) {
        alert('pas');
    },
    // Sobrescribir el método removeOrderline para incluir la lógica de eliminación de combos
    removeOrderline(line) {
        // Llamar al método removeOrderline original de la clase Order
        super.removeOrderline(...arguments);
        var self = this;
        // Obtener el identificador de combo de la línea
        let combo_pro_line = line.sh_combo_count;
        // Remover productos del combo
        this.remove_combo_product(combo_pro_line);
    }
});

// Parchear la clase Orderline para agregar funcionalidades adicionales
patch(Orderline.prototype, {
    // Método setup que se ejecuta al inicializar una línea de orden
    setup() {
        // Llamar al método setup original de la clase Orderline
        super.setup(...arguments);
        // Inicializar el contador de combos a 0
        this.sh_combo_count = 0;
    },
    // Método para determinar si una línea de orden puede ser fusionada con otra
    can_be_merged_with(orderline) {
        // Si la configuración de bundle de productos está habilitada
        if (this.pos.config.enable_product_bundle) {
            // Si el producto de la línea actual no es el mismo que el de la otra línea
            if (this.get_product().id !== orderline.get_product().id) {
                // Las líneas no pueden ser fusionadas
                return false;
            } else {
                // Las líneas pueden ser fusionadas
                return true;
            }
        } else {
            // Llamar al método can_be_merged_with original de la clase Orderline
            return _super_Orderline.can_be_merged_with.apply(this, arguments);
        }
    }
});
