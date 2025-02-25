/** @odoo-module */

import { Order, Orderline, Payment } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

patch(Order.prototype, {
    add_paymentline(payment_method) {
		this.assert_editable();
		let rate_company = this.pos.config.rate_company;
		let show_currency_rate = this.pos.config.show_currency_rate;
		if (this.electronic_payment_in_progress()) {
			return false;
		} else {
			var newPaymentline = new Payment({ env: this.env },{
				order: this, payment_method:payment_method, pos: this.pos});
			var due = this.get_due();
			newPaymentline.set_amount(due);
			if(payment_method.pago_usd){
				let price = due;
				if(rate_company > show_currency_rate){
					price =  show_currency_rate * due;
				}
				else if(rate_company < show_currency_rate){
					price = due /rate_company;
				}

				newPaymentline.set_usd_amt(price);

			}
			this.paymentlines.add(newPaymentline);
			this.select_paymentline(newPaymentline);
			if(this.pos.config.cash_rounding){
				this.selected_paymentline.set_amount(0);
		 		this.selected_paymentline.set_amount(due);
			}

			if (payment_method.payment_terminal) {
				newPaymentline.set_payment_status('pending');
			}
			return newPaymentline;
		}
	}
});

patch(Payment.prototype, {
    setup() {
        super.setup(...arguments);
		this.usd_amt = this.usd_amt || "";
    },
    //@override
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        if (json) {
            json.usd_amt = this.usd_amt;
        }
        return json;
    },
    //@override
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.usd_amt = json.usd_amt;
    },
   
    set_usd_amt(usd_amt){
		this.usd_amt = usd_amt;
	},

	get_usd_amt(){
		return this.usd_amt;
	},
});

