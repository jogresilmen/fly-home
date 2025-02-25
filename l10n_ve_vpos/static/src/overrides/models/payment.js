/** @odoo-module */ 
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";

patch(PaymentScreen.prototype, {
  setup(_defaultObj, options) {
    super.setup(...arguments);
    this.terminalServiceId = false;
  },

  init_from_JSON(json) {
    super.init_from_JSON(...arguments);
    this.terminalServiceId = json.terminal_service_id;
  },

  export_as_JSON() {
    const json = super.export_as_JSON(...arguments);
    json.terminal_service_id = this.terminalServiceId;
    return json;
  },

  setTerminalServiceId(id) {
    this.terminalServiceId = id;
  },
});