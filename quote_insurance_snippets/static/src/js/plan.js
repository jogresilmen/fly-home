/** @odoo-module **/

import { Component, onMounted } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class AddToCartButton extends Component {
    setup() {
        this.orm = useService("orm");

        onMounted(() => {
            document.querySelectorAll("a.btn-main").forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.preventDefault();
                    this._addToCart(event.target);
                });
            });

            document.querySelectorAll("a.redirec").forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.preventDefault();
                    window.history.back();
                });
            });
        });
    }

    async _addToCart(button) {
        const planId = button.dataset.planId;
        const productId = button.dataset.productId;
        const productPrice = button.dataset.productPrice;

        console.log(planId, productId, productPrice);

        try {
            await this.orm.call("sale.order", "update_cart", {
                product_id: productId,
                planId: planId,
                set_qty: 1,
                productPrice: productPrice,
            });
            window.location.href = "/shop/cart";
        } catch (error) {
            console.error("Error al agregar al carrito:", error);
        }
    }
}

// **IMPORTANTE:** Asegúrate de definir la plantilla en XML
AddToCartButton.template = "your_module.AddToCartButton";
