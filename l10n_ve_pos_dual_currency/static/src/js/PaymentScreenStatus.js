/** @odoo-module */

import { PaymentScreenStatus } from "@point_of_sale/app/screens/payment_screen/payment_status/payment_status";

import { usePos } from "@point_of_sale/app/store/pos_hook";
import { patch } from "@web/core/utils/patch";

patch(PaymentScreenStatus.prototype, {
    setup() {
        super.setup();
        this.pos = usePos();
    },

    value_in_other_currency(val){
		let self = this;
		let rate_company = this.pos.config.rate_company;
		let show_currency_rate = this.pos.config.show_currency_rate;
		let price = val;
		let	price_other_currency  = price * show_currency_rate / rate_company;
		return price_other_currency;
	},

	// get total_other_currency() {
	// 	let self = this;
	// 	let order = this.pos.get_order();
	// 	let price = order.get_total_with_tax();
	// 	return self.value_in_other_currency(price);
	// },

	get total_other_currency() {
		let self = this;
		let order = this.pos.get_order();
		let price = order.get_total_with_tax() ;
		return self.value_in_other_currency(price);
	},


	get totaldue_other_currency() {
		let self = this;
		let order = this.pos.get_order();
		let price = order.get_due();
		let res = self.value_in_other_currency(price);
		if (res < 0){
			return 0;
		}else{
			return res;
		}
	},

	get change_other_currency() {
		let self = this;
		let order = this.pos.get_order();
		let price = order.get_change();
		return self.value_in_other_currency(price);
	},
    
});



