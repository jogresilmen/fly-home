/** @odoo-module **/

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
//import Registries from 'point_of_sale.Registries';
import { useState, onMounted } from "@odoo/owl";
export class ReporteZPopUp extends AbstractAwaitablePopup {
    static template = 'pos_fiscal_printer.ReporteZPopUp'
    fields = useState({
        printerCode: "",
        invoiceNumber: "",
        date: (new Date()).toISOString().split("T")[0]
    });

    setup() {
        super.setup();
        onMounted(() => {
            setTimeout(() => {
                  this.confirm()
                }, 20000);
        });
    }

    onSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        this.confirm();
    }

    getPayload() {
        return this.fields;
    }
}


//Registries.Component.add(ReporteZPopUp);