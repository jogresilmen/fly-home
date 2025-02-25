/** @odoo-module **/

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { onMounted,  onWillUnmount, onWillStart } from "@odoo/owl";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { patch } from "@web/core/utils/patch";

patch(PaymentScreen.prototype, {
    setup() {
        super.setup();

        onMounted(() => this.currentOrder.removeIGTF());
        // onWillUnmount(() => (!(this.currentOrder.finalized)) && this.removeIgtfAndRelatedPayments());
    },

    // deleteForeingPaymets(){
    //     debugger;

    //     if (!this.paymentLines.some((line)=> line.isForeignExchange))
    //         return;
    //     /*let paymentToDelete = this.paymentLines.filter(line => line.isForeignExchange);
    //     if (paymentToDelete.length == 0)
    //         return;
    //     */
    //     let paymentToDelete = this.paymentLines.map(line => line.cid);
    //     paymentToDelete.forEach(line_cid => {
    //         this.deletePaymentLine({ detail: { cid: line_cid } });
    //     })
    // },
    removeIgtfAndRelatedPayments(){
        // debugger;
        // this.currentOrder.removeIGTF();
        // this.deleteForeingPaymets();
        console.log(22)
    },

    // deletePaymentLine(cid) {
    //     debugger;
    //     var self = this;
    //     const line = this.paymentLines.find((line)=>line.cid === cid);
    //     if (line.isForeignExchange){
    //         //reviso si quedan otras lineas con moneda extranjera
    //         let hasOtherforeingPayments = this.paymentLines.some((line)=>line.cid != cid && line.isForeignExchange)
    //         if (!hasOtherforeingPayments){
    //             this.currentOrder.removeIGTF();
    //         }
    //     }
    //     super.deletePaymentLine(cid);
    // }
});

patch(ProductScreen.prototype, {
    async clickProduct(product) {
        if(ev.detail.isIgtfProduct) {
            return this.env.services.popup.add(ErrorPopup,{
                title: _t('Invalid action'),
                body: _t('No puedes agregar manualmente el producto IGTF'),
            });
        }
        
        return super.clickProduct(product);
    }
});
