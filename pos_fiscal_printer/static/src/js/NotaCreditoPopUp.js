/** @odoo-module **/

import { useState } from "@odoo/owl";
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";

export class NotaCreditoPopUp extends AbstractAwaitablePopup {
  static template = "pos_fiscal_printer.NotaCreditoPopUp";
  fields = useState({
    printerCode: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
  });

  onMounted() {
    this.fields.printerCode = this.pos.config.x_fiscal_printer_code;
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
