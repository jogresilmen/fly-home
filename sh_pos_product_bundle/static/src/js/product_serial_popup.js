/** @odoo-module */

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { useState, useRef, onMounted } from "@odoo/owl";
import { Input } from "@point_of_sale/app/generic_components/inputs/input/input";
import { useService } from "@web/core/utils/hooks";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { _t } from "@web/core/l10n/translation";

export class ProductSerialPopup extends AbstractAwaitablePopup {
    static template = "sh_pos_product_bundle.ProductSerialPopup";
    static components = { Input };

    setup() {
        super.setup();
        this.orm = useService("orm");
        this.pos = usePos();
        this.popup = useService("popup");
        this.product_tmpl_id_bundle = this.props.product_tmpl_id_bundle;
        this.parentProductId = this.props.parentProductId;
        this.productId_Original = this.props.productId_Original;
        this.qty = parseInt(this.props.qty);

        this.state = useState({
            serial: "",
            selected_product: "",
            optional_products: [],
            qty: this.qty,
            lines: [{ product_id: this.productId_Original, qty: this.qty }] // Línea original
        });

        this.selectRef = useRef("selectElement");
        this.tbodyRef = useRef("tbodyElement");

        onMounted(async () => {
            await this.loadOptionalProducts_();
            this.initializeLines(); // Inicializa las líneas después de cargar los productos
        });
    }

    async loadOptionalProducts_() {
        try {
            const bundles = this.pos.db.get_product_by_id(this.parentProductId);
            if (bundles.sh_is_bundle) {
                const bundles_ = this.pos.db.get_bundles_by_product_id(this.product_tmpl_id_bundle);
                if (bundles_ && bundles_.length > 0) {
                    for (const b of bundles_) {
                        const fields = ['id', 'display_name', 'barcode'];
                        if (b.sh_product_id === this.productId_Original) {
                            // Obtiene el producto original
                            const productsOR = await this.orm.call(
                                "product.product",
                                "search_read",
                                [[["id", "=", this.productId_Original]]],
                                { fields: fields }
                            );

                            let all_option_ids_item = [];
                            if (b.sh_options_bundle_product_ids) {
                                all_option_ids_item.push(...b.sh_options_bundle_product_ids);
                            }

                            // Obtiene los productos opcionales
                            const products = await this.orm.call(
                                "product.product",
                                "search_read",
                                [[["product_tmpl_id", "in", all_option_ids_item]]],
                                { fields: fields }
                            );

                            // Agrega el campo 'select' con valor true al producto original
                            productsOR.forEach(product => {
                                product.select = true;
                            });

                            // Agrega el campo 'select' con valor false a los productos opcionales
                            products.forEach(product => {
                                product.select = false;
                            });

                            // Combina los productos
                            products.unshift(...productsOR);

                            // Configura el estado con los productos opcionales
                            this.state.optional_products = products;

                            // Establece el producto original como seleccionado por defecto
                            if (productsOR.length > 0) {
                                this.state.selected_product = productsOR[0].id;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            this.popup.add(ErrorPopup, {
                title: _t("Error al cargar productos opcionales"),
                body: _t(`No se pudieron cargar los productos opcionales. Por favor, inténtelo de nuevo más tarde.`),
            });
        }
    }

    initializeLines() {
        const tbody = this.tbodyRef.el;
        if (!tbody) {
            this.popup.add(ErrorPopup, {
                title: _t("Error al inicializar líneas"),
                body: _t("No se encontró el elemento tbody para inicializar las líneas."),
            });
            return;
        }

        const rows = tbody.querySelectorAll("tr.data_tr");
        rows.forEach((row, index) => {
            // Asigna valores fijos para cada línea
            this.state.lines[index] = {
                product_id: this.productId_Original,
                qty: this.qty,
                parent_product_id: this.parentProductId
            };
        });
    }

    addNewLine() {
        const tbody = this.tbodyRef.el;
        if (!tbody) {
            this.popup.add(ErrorPopup, {
                title: _t("Error al agregar nueva línea"),
                body: _t("No se encontró el elemento tbody para agregar una nueva línea."),
            });
            return;
        }

        const rows = tbody.querySelectorAll("tr.data_tr");
        if (rows.length === 0) {
            this.popup.add(ErrorPopup, {
                title: _t("Error al agregar nueva línea"),
                body: _t("No se encontraron filas con la clase data_tr para duplicar."),
            });
            return;
        }

        const originalRow = rows[0];
        const newRow = originalRow.cloneNode(true);

          // Restar 1 a la cantidad original
    if (this.state.qty > 1) {
        this.state.qty -= 1; // Restamos una unidad
    } else {
        this.popup.add(ErrorPopup, {
            title: _t("Cantidad insuficiente"),
            body: _t("No puedes agregar más líneas. La cantidad original es insuficiente."),
        });
        return;
    }

    // Actualizar la cantidad en la fila original
    const originalQtyInput = originalRow.querySelector('.qty');
    if (originalQtyInput) {
        originalQtyInput.value = this.state.qty; // Actualizar el valor en la fila original
        originalQtyInput.dispatchEvent(new Event('change')); // Disparar el evento 'change' para actualizar el estado
    }

        // Reinicia la cantidad de la nueva fila
        const barcode = newRow.querySelector('.bard');
        if (barcode) {
            barcode.addEventListener('change', (ev) => {
                this.searchProductByBarcode(ev);
            });
        }
        const newQtyInput = newRow.querySelector('.qty');
        if (newQtyInput) {
            newQtyInput.value = "1";
            // Reasignar el evento 'change'
            newQtyInput.addEventListener('change', (ev) => {
                this.updateLineData(ev);
            });
        }

        // Reasigna el evento 'change' al nuevo select
        const newSelect = newRow.querySelector('.select');
        if (newSelect) {
            newSelect.addEventListener('change', (ev) => {
                this.updateLineData(ev);
            });
        }

        // Insertar la nueva fila antes del botón de agregar nueva línea, si existe
        const btnLink = tbody.querySelector('.btn-link');
        if (btnLink) {
            tbody.insertBefore(newRow, btnLink);
        } else {
            tbody.appendChild(newRow);
        }

        // Asigna los valores de la nueva línea en el estado, considerando que es una copia de la original
        this.state.lines.push({
            product_id: this.productId_Original, // Usa el valor inicial por defecto
            qty: 1,  // La cantidad por defecto para nuevas líneas
            parent_product_id: this.parentProductId
        });
    }

    updateLineData(ev) {
        const selectedRow = ev.target.closest('tr');
        const selectElement = selectedRow.querySelector('.select');
        const qtyInput = selectedRow.querySelector('.qty');
        const lineIndex = Array.from(selectedRow.parentNode.children).indexOf(selectedRow);

        const selectedOptionValue = selectElement ? selectElement.value : "";
        const qtyValue = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
        console.log(selectedOptionValue);

        // Actualiza los datos de la línea en el estado correspondiente
        this.state.lines[lineIndex] = {
            product_id: parseInt(selectedOptionValue),
            qty: qtyValue,
            parent_product_id: this.parentProductId
        };
    }

    searchProductByBarcode(ev) {
        const barcode = ev.target.value;
        const selectedRow = ev.target.closest('tr');
        const selectElement = selectedRow.querySelector('.select');

        if (selectElement) {
            let found = false;
            for (const option of selectElement.options) {
                option.removeAttribute('selected');
            }
            for (const option of selectElement.options) {
                if (option.getAttribute('data-product-id') === barcode) {
                    selectElement.value = option.value;
                    this.state.selected_product = option.value;
                    option.setAttribute('selected', "");

                    const qtyInput = selectedRow.querySelector('.qty');
                    const lineIndex = Array.from(selectedRow.parentNode.children).indexOf(selectedRow);
                    const qtyValue = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
                    this.state.lines[lineIndex] = {
                        product_id: parseInt(option.value),
                        qty: qtyValue,
                        parent_product_id: this.parentProductId
                    };
                    found = true;
                    break;
                }
            }
        }
    }
    getPayload() {
        return {
            serial: this.state.serial,
            lines: this.state.lines, // este si se va a usar 
        };
    }
}
