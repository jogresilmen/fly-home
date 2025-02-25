/** @odoo-module */

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";

patch(PaymentScreen.prototype, {
    addNewPaymentLine(paymentMethod) {
		let self = this;
		let result = false;
		let payment_method = null;
		let igtf_pay = null;
		for (let i = 0; i < this.pos.payment_methods.length; i++ ) {
			if (this.pos.payment_methods[i].id === paymentMethod.id ){
				if(this.pos.payment_methods[i]['is_igtf'] === true){
					payment_method = this.pos.payment_methods[i];
					igtf_pay = true;
					break;
				}else{
					payment_method = this.pos.payment_methods[i];
					break;
				}   
			}
		}
		if(igtf_pay == true){
			let order = this.pos.get_order();
			let due = order.get_due();
			let total  = self.pos.company.igtf_percentage * 0.01 * due;

			this.pos.get_order().set_igtf_charge(total);
			result = this.currentOrder.add_paymentline(payment_method);
		}else{
			result = this.currentOrder.add_paymentline(paymentMethod);			
		}
        if (result) {
            this.numberBuffer.reset();
            return true;
        } else {
            this.popup.add(ErrorPopup, {
                title: _t("Error"),
                body: _t("There is already an electronic payment in progress."),
            });
            return false;
        }
	},

	updateSelectedPaymentline(amount = false) {
        if (this.paymentLines.every((line) => line.paid)) {
            this.currentOrder.add_paymentline(this.payment_methods_from_config[0]);
        }
        if (!this.selectedPaymentLine) {
            return;
        } // do nothing if no selected payment line
        if (amount === false) {
            if (this.numberBuffer.get() === null) {
                amount = null;
            } else if (this.numberBuffer.get() === "") {
                amount = 0;
            } else {
                amount = this.numberBuffer.getFloat();
            }
        }
        // disable changing amount on paymentlines with running or done payments on a payment terminal
        const payment_terminal = this.selectedPaymentLine.payment_method.payment_terminal;
        const hasCashPaymentMethod = this.payment_methods_from_config.some(
            (method) => method.type === "cash"
        );
        if (
            !hasCashPaymentMethod &&
            amount > this.currentOrder.get_due() + this.selectedPaymentLine.amount
        ) {
            this.selectedPaymentLine.set_amount(0);
            this.numberBuffer.set(this.currentOrder.get_due().toString());
            amount = this.currentOrder.get_due();
            this.showMaxValueError();
        }
        if (
            payment_terminal &&
            !["pending", "retry"].includes(this.selectedPaymentLine.get_payment_status())
        ) {
            return;
        }
        if (amount === null) {
            this.deletePaymentLine(this.selectedPaymentLine.cid);
        } else {
        	let self = this;
			let rate_company = this.pos.config.rate_company;
			let show_currency_rate = this.pos.config.show_currency_rate;
            if(this.selectedPaymentLine.payment_method.is_igtf){
				let due = this.numberBuffer.getFloat();
				let total  = this.pos.company.igtf_percentage * 0.01 * due;
				let	price_other_currency = due+total;
				this.pos.get_order().set_igtf_charge(total);

				if(this.selectedPaymentLine.payment_method.pago_usd){
					let it = 0;
					if(rate_company > show_currency_rate){
						it = (total / show_currency_rate).toFixed(2);
					}else{
						it = ((total * show_currency_rate)/rate_company).toFixed(2);
					}
					this.pos.get_order().set_igtf_charge(parseFloat(it));
					// price_other_currency = price_other_currency * rate_company;
					price_other_currency = (rate_company * price_other_currency) / show_currency_rate;
					this.selectedPaymentLine.set_usd_amt(due+total);
				}

				this.selectedPaymentLine.set_amount(price_other_currency);
			}else{
				let	price_other_currency = this.numberBuffer.getFloat();
				if(this.selectedPaymentLine.payment_method.pago_usd){
					// price_other_currency = price_other_currency * rate_company;
					price_other_currency = (rate_company * price_other_currency) / show_currency_rate;
					this.selectedPaymentLine.set_usd_amt(this.numberBuffer.getFloat());
				}
				this.selectedPaymentLine.set_amount(price_other_currency);
			}
        }
    },
});
