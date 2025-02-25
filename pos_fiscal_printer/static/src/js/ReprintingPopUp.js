/** @odoo-module **/

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
//import Registries from 'point_of_sale.Registries';
import { PrintingMixin } from "./PrintingMixin";
import { Component, useState } from "@odoo/owl";
import { Navbar } from "@point_of_sale/app/navbar/navbar";
import { patch } from "@web/core/utils/patch";

patch(Navbar.prototype, {
  async onReprintButtonClick() {
    // TODO
  },
});

export class ReprintingButton extends AbstractAwaitablePopup {
  static template = "pos_fiscal_printer.ReprintingButton";
  static Component = { PrintingMixin };
  async doReprinting() {
    const { confirmed, payload } = await this.showPopup("ReprintingPopUp");

    if (!confirmed) return;

    this.printerCommands = payload;

    this.actionPrint();
  }
}

export class ReprintingPopUp extends AbstractAwaitablePopup {
  static template = "pos_fiscal_printer.ReprintingPopUp";
  fields = useState({
    printingMode: "numero",
    document: "f",
    cedula: "",
    fromDate: "",
    toDate: "",
    fromNumber: "",
    toNumber: "",
  });

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    this.confirm();
  }

  async getPayload() {
    const { document, printingMode } = this.fields;

    switch (printingMode) {
      case "ultimo":
        return ["RU00000000000000"];
      case "numero":
        const padding = (str) => str.padStart(7, "0");

        return [
          "R",
          document === "*" ? "@" : document.toUpperCase(),
          padding(this.fields.fromNumber),
          padding(this.fields.toNumber),
        ].join("");
      case "cedula":
        return ["RK" + this.fields.cedula];
      case "fecha":
        const datestr = (date) => moment(date).format("0YYMMDD");

        return [
          "R",
          document,
          datestr(this.fields.fromDate),
          datestr(this.fields.toDate),
        ];
    }
  }
}
