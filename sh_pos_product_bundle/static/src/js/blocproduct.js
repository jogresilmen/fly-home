/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { usePos } from "@point_of_sale/app/store/pos_hook";


patch(ProductCard.prototype, {
    setup() {
        super.setup();
        this.sh_is_bundle = this.props.sh_is_bundle || false;
    },
    
    // Método para manejar la propiedad sh_is_bundle
    get isBundle() {
        return this.sh_is_bundle;
    },
    
    
});


patch(ProductScreen.prototype, {
    setup() {
        super.setup(...arguments);
    },
    _setValue(val) {
        
        const { numpadMode } = this.pos;
        const selectedLine = this.currentOrder.get_selected_orderline(); 
        
        if (selectedLine) {
            const isSaleOrder = selectedLine.get_sale_order && selectedLine.get_sale_order();
            if (numpadMode === "quantity") {

                selectedLine.price_type = "manual";
                selectedLine.order.update_combo_qty(selectedLine.sh_combo_count, val, selectedLine)
                if(selectedLine.productId_Original || isSaleOrder){
                    
            
                    this.popup.add(ErrorPopup, {
                        title: _t("Producto Flash"),
                        body: _t("producto no puede ser modificado  "),
                    });
                    return false;

                }
                
            }
            if (numpadMode === "price") {
                if(selectedLine.productId_Original || isSaleOrder){
                    this.popup.add(ErrorPopup, {
                        title: _t("Producto Flash"),
                        body: _t("producto no puede ser modificado  "),
                    });
                    return false;

                }
                
            }
        }
        super._setValue(...arguments)
    }
})