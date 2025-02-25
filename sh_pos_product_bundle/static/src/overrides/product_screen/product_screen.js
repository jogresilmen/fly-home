/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";

patch(ProductScreen.prototype, {
    setup() {
        super.setup(...arguments);
    },
    _setValue(val) {
        super._setValue(...arguments)
        const { numpadMode } = this.pos;
        const selectedLine = this.currentOrder.get_selected_orderline();
       
        if (selectedLine) {
            if (numpadMode === "quantity") {
                selectedLine.price_type = "manual";
                selectedLine.order.update_combo_qty(selectedLine.sh_combo_count, val, selectedLine)
            }
        }
    }
})