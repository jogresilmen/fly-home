/** @odoo-module */
import { useService } from "@web/core/utils/hooks";
import { useState, useRef } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { Input } from "@point_of_sale/app/generic_components/inputs/input/input";

export class ProductQtyPopup extends AbstractAwaitablePopup {
    static template = "sh_pos_product_bundle.ProductQtyPopup";
    static components = { Input };

    setup() {
        super.setup();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.pos = usePos();
        this.product = this.props.product;
        this.bundle_products = this.props.bundle_by_product_id;
        this.selectRef = useRef("selectElement");
        console.log(this.product,this.bundle_products)
        this.state = useState({
            product_id: this.product.id,
            product_tax:this.product.taxes_id,
            tax_check:false,
            product_qty: 1,
            product_price: this.product.lst_price,
            combo_products: Object.fromEntries(this.bundle_products.map((elem) => [elem[0], { product_id: elem[0], qty: elem[1], price: elem[3], productId_Original: elem[0] }])),
            optional_products: [],
        });
        
        this.loadOptionalProducts();
    }

    async loadOptionalProducts() {
        const bundle = this.pos.db.get_bundles_by_product_id(this.product.product_tmpl_id);
        if (bundle && bundle.length > 0) {
            const all_option_ids = {};
    
            for (const b of bundle) {
                let all_option_ids_item = [];
                if (b.sh_options_bundle_product_ids) {
                    all_option_ids_item.push(...b.sh_options_bundle_product_ids);
                }
                const fields = ['id', 'display_name', 'barcode'];
                try {
                    const products = await this.orm.call(
                            "product.product",
                            "search_read",
                            [[["product_tmpl_id", "in", all_option_ids_item]]],
                            { fields: fields }
                        );
                    all_option_ids[b.sh_product_id] = products;
                } catch (error) {
                    console.error("Error fetching optional products:", error);
                }
            }
            this.state.optional_products = all_option_ids;
        } else {
            console.log("No se encontraron bundles para el product_tmpl_id.");
        }
    }

    // searchProductByBarcode(ev) {
    //     const barcode = ev.target.value;
    //     const selectElement = this.selectRef.el;
        
    //     if (selectElement) {
    //         for (const option of selectElement.options) {
    //             if (option.getAttribute('data-product-id') === barcode) {
    //                 selectElement.value = option.value;
    //                 this.updateProducts({ target: selectElement }); // Llama a updateProducts cuando se encuentra el producto
    //                 break;
    //             }
    //         }
    //     }
    // }
    
    updateProducts(event) {
        const selectedProductId = parseInt(event.target.value, 10);
        const currentProductId = this.state.product_id; 
        const productId_ = parseInt(event.target.getAttribute('data-current-product-id'), 10); 
        const selectedProduct = this.pos.db.get_product_by_id(selectedProductId);
        if (selectedProduct) {
            if (this.state.combo_products[productId_]) {
                this.state.combo_products[productId_].productId_Original = this.state.combo_products[productId_].product_id;
                this.state.combo_products[productId_].product_id = selectedProductId;
            }
            this.state.combo_products[productId_].price = selectedProduct.lst_price;
        }
    }

    captureChange(ev) {
        var value = ev.target.value;
        this.state.product_price = this.state.product_price * parseFloat(value);
        for (let i = 0; i < Object.keys(this.state.combo_products).length; i++) {
            let product_id = Object.keys(this.state.combo_products)[i];
            this.state.combo_products[parseInt(product_id)].productId_Original = parseInt(product_id);
            this.state.combo_products[parseInt(product_id)].qty *= parseFloat(value);
        }
    }

    checkTaxes(ev) {
        var value = ev.target.value;
        if('checked' in ev.target) {
            this.state.tax_check = ev.target.checked
    
        }
    }   

    getPayload() {
        return this.state;
    }
}
