/** @odoo-module */

import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { parseFloat } from "@web/views/fields/parsers";
import { useState } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { CashMoveReceipt } from "@point_of_sale/app/navbar/cash_move_popup/cash_move_receipt/cash_move_receipt";
import { useAsyncLockedMethod } from "@point_of_sale/app/utils/hooks";
import { Input } from "@point_of_sale/app/generic_components/inputs/input/input";

export class ProductBundlePopup extends AbstractAwaitablePopup {
    static template = "sh_pos_product_bundle.ProductBundlePopup";
    static components = { Input };
    setup() {
        super.setup();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.pos = usePos();
    }

}
