/** @odoo-module **/

import { Orderline, Order, Product, Payment } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";

patch(Product.prototype, {
    get isIgtfProduct() {
        const { x_igtf_product_id } = this.pos.config;
        return x_igtf_product_id ? x_igtf_product_id[0] === this.id : false;
    }
});

patch(Payment.prototype, {
    // Nueva propiedad para rastrear si el popup ya fue mostrado para este método de pago
    _popupShown: false,

    get isForeignExchange() {
        return this.payment_method.x_is_foreign_exchange;
    },

    async set_amount(value) {
        var igtf_antes = this.order.x_igtf_amount;
        console.log(igtf_antes);
        console.log(value);
        console.log(this);
        if (value == this.order.get_due()) {
            super.set_amount(value);
        } else {
            if (value != igtf_antes) {
                if (this.isForeignExchange) {
                    super.set_amount(value);
                } else {
                    super.set_amount(value);
                }
            }
        }

        const igtfProduct = this.pos.config.x_igtf_product_id;
        if (!(igtfProduct || igtfProduct?.length)) return;
        if (!this.isForeignExchange) return;
        if (value == igtf_antes) return;

        this.order.removeIGTF();
        const price = this.order.x_igtf_amount;

        // Verifica si el popup ya fue mostrado para este método de pago específico
        if (this._popupShown) {
            if(this.order.sigtef){
                console.log(igtfProduct[0])
                this.order.add_product(this.pos.db.get_product_by_id(igtfProduct[0]), {
                    quantity: 1,
                    price,
                    lst_price: price,
                });
            }
            
            this._popupShown = true;
        }else{
            const { confirmed } = await this.env.services.popup.add(ConfirmPopup, {
                title: "Atención",
                body: `¿Aplicar servicio de empaquetado?`,
                confirmText: "Sí",
                cancelText: "No",
            });
            this.order.sigtef = false
            if (confirmed) {
                this.order.add_product(this.pos.db.get_product_by_id(igtfProduct[0]), {
                    quantity: 1,
                    price,
                    lst_price: price,
                });
                this.order.sigtef = true
            }
            this._popupShown = true;
        }

        
    }
});

patch(Orderline.prototype, {
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.x_is_igtf_line = json.x_is_igtf_line;
    },
    export_as_JSON() {
        const result = super.export_as_JSON(...arguments);
        result.x_is_igtf_line = this.x_is_igtf_line;
        return result;
    },
    export_for_printing() {
        const json = super.export_for_printing(...arguments);
        json.x_is_igtf_line = this.x_is_igtf_line;
        return json;
    },
});

patch(Order.prototype, {
    get x_igtf_amount() {
        var igtf_monto = this.paymentlines
            .filter((p) => p.isForeignExchange)
            .map(({ amount, payment_method: { x_igtf_percentage } }) => amount * (x_igtf_percentage / 100))
            .reduce((prev, current) => prev + current, 0);

        var total = this.orderlines.filter((p) => !p.x_is_igtf_line).map((p) => p.get_price_with_tax()).reduce((prev, current) => prev + current, 0);

        let total_packs = this.orderlines.filter((p) => !p.x_is_igtf_line)
            .flatMap(e => e.selected_product_list)
            .flatMap(e => e)
            .filter(e => typeof(e) === 'object' && e.price_unit != 0)
            .map(e => e.price_unit * e.qty)
            .reduce((prev, current) => prev + current, 0);

        total += total_packs;

        var max_igtf = total * 0.03;

        if (igtf_monto > max_igtf) {
            igtf_monto = max_igtf;
        }
        return parseFloat(max_igtf);
    },

    removeIGTF() {
        this.orderlines
            .filter(({ x_is_igtf_line }) => x_is_igtf_line)
            .forEach((line) => this._unlinkOrderline(line));
    },

    set_orderline_options(orderline, options) {
        super.set_orderline_options(orderline, options);
        orderline.x_is_igtf_line = orderline.product.isIgtfProduct;
    },
});
