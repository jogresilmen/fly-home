# -*- coding: utf-8 -*-
# Part of Softhealer Technologies.

from odoo import http, SUPERUSER_ID
from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale
import json


class ShWebsiteSale(WebsiteSale):

    @http.route(
        ["/shop/cart/update_json"],
        type="json",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def cart_update_json(
        self, product_id, line_id=None, add_qty=None, set_qty=None, display=True, **kw
    ):
        """
        This route is called :
            - When changing quantity from the cart.
            - When adding a product from the wishlist.
            - When adding a product to cart on the same page (without redirection).
        """
        order = request.website.sale_get_order(force_create=1)
        for line in order.order_line:
            if line.is_bundle_item:
                if set_qty != None and set_qty > 0:
                    line.sudo().write(
                        {"product_uom_qty": line.sh_bundle_initial_qty * float(set_qty)}
                    )
        # ==========================  Remove Related Bundle Lines if User Remove Main Product  ================================
        line_record = request.env["sale.order.line"].sudo().browse(line_id)
        if (
            line_record
            and line_record.product_id
            and line_record.product_id.sh_bundle_product_ids
            and line_record.product_id.sh_is_bundle
            and set_qty == 0
        ):

            bundle_product_ids_list = (
                line_record.product_id.sh_bundle_product_ids.mapped("sh_product_id").ids
            )

            bundle_product_lines = line_record.order_id.order_line.filtered(
                lambda each_line: each_line.product_id.id in bundle_product_ids_list
            )
            bundle_product_lines.sudo().unlink()
        # ==========================  Remove Related Bundle Lines if User Remove Main Product  ================================
        return super(ShWebsiteSale, self).cart_update_json(
            product_id, line_id, add_qty, set_qty, **kw
        )

    @http.route("/update_cart_line", type="http", auth="public", methods=["GET"])
    def update_cart_line(self, product_id=None, line_id=None, add_qty=1, display=None):
        try:

            # Verifica que los parámetros necesarios se hayan pasado correctamente
            if not product_id or not line_id:
                return request.make_response(
                    json.dumps(
                        {
                            "status": "error",
                            "message": "Parámetros product_id y line_id son necesarios",
                        }
                    ),
                    headers=[("Content-Type", "application/json")],
                )

            # Obtiene el sitio web actual
            website = request.env["website"].get_current_website()
            sale_order = website.sale_get_order()

            line = request.env["sale.order.line"].sudo().browse(int(line_id))
            product = request.env["product.product"].sudo().browse(int(product_id))

            if line and product:
                # Actualiza la línea de pedido con el nuevo producto
                line.product_id = product.id
                # line.product_uom_qty = int(add_qty)  # Ajusta la cantidad según sea necesario
                sale_order._cart_update(
                    product_id=product.id,
                    line_id=line.id,
                    # add_qty=int(add_qty),
                    # set_qty=int(add_qty)
                )
                return request.make_response(
                    json.dumps(
                        {"status": "success", "message": "Línea de orden actualizada"}
                    ),
                    headers=[("Content-Type", "application/json")],
                )
            else:
                return request.make_response(
                    json.dumps(
                        {"status": "error", "message": "Línea o producto no encontrado"}
                    ),
                    headers=[("Content-Type", "application/json")],
                )
        except Exception as e:
            return request.make_response(
                json.dumps({"status": "error", "message": str(e)}),
                headers=[("Content-Type", "application/json")],
            )

    # @http.route(["/shop/checkout"], type="http", auth="public", website=True)
    # def checkout(self, **post):
    #     res = super(ShWebsiteSale, self).checkout(**post)
    #     order = request.website.sale_get_order()
    #     for line in order.order_line:
    #         if line.is_bundle_item:
    #             line.sudo().write(
    #                 {
    #                     # "price_unit": 0.0,
    #                 }
    #             )
    #     return res

    # @http.route(["/shop/confirm_order"], type="http", auth="public", website=True)
    # def confirm_order(self, **post):
    #     res = super(ShWebsiteSale, self).confirm_order(**post)
    #     order = request.website.sale_get_order()
    #     for line in order.order_line:
    #         if line.is_bundle_item:
    #             line.sudo().write(
    #                 {
    #                     # "price_unit": 0.0,
    #                 }
    #             )
    #     return res

    @http.route(
        ["/shop/get_optional_products"],
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
    )
    def get_optional_products(self, product_id):
        tag = False
        optional_products = []
        bundles = request.env["sh.product.bundle"].search(
            [("sh_product_id", "=", int(product_id))]
        )
        products = request.env["product.product"].search([("id", "=", int(product_id))])
        for product in products:
            optional_products.append({"id": product.id, "name": product.display_name})

        sh_options_bundle_product_ids = []
        for bundle in bundles:
            if bundle.sh_options_bundle_product_ids:
                for i in bundle.sh_options_bundle_product_ids:
                    sh_options_bundle_product_ids.append(i.id)

        if sh_options_bundle_product_ids:
            products = request.env["product.product"].search(
                [("product_tmpl_id", "in", sh_options_bundle_product_ids)]
            )
            tag = True

            for product in products:
                optional_products.append(
                    {"id": product.id, "name": product.display_name}
                )

        response_data = {"tag": tag, "optional_products": optional_products}

        return request.make_response(
            json.dumps(response_data), [("Content-Type", "application/json")]
        )

    @http.route(
        ["/shop/cart/duplicate_product_line"],
        type="http",
        auth="public",
        methods=["GET"],
        website=True,
    )
    def duplicate_product_line(self, line_id, new_product_id, qty, product_id):
        sale_order_line = request.env["sale.order.line"].sudo()
        product = request.env["product.product"].sudo().browse(int(new_product_id))
        productORI = request.env["product.product"].sudo().browse(int(product_id))
        sale_order_line_browse = sale_order_line.browse(int(line_id))

        # Validar existencia de la línea del pedido
        if not sale_order_line_browse:
            response_data = {
                "status": "error",
                "message": "La línea del pedido no se encontró.",
            }

            return request.make_response(
            json.dumps(response_data), [("Content-Type", "application/json")]
            )
            

        # Validar cantidad del producto principal
        if sale_order_line_browse.product_uom_qty <= 1:
            
            response_data = {
                "status": "error",
                "message": "La cantidad del producto principal no puede ser menor que 1.",
            }

            return request.make_response(
                json.dumps(response_data), [("Content-Type", "application/json")]
            )

        

        # Reducir la cantidad del producto principal
        sale_order_line_browse.product_uom_qty -= 1
        sale_order_line_browse.sh_bundle_initial_qty -= 1

        # Crear una nueva línea en el pedido con el producto opcional
        try:
            add = sale_order_line.create({
                "order_id": sale_order_line_browse.order_id.id,
                "product_uom_qty": 1,  # Utilizar la cantidad proporcionada
                "product_id": new_product_id,
                "name": f'{product.display_name} ({productORI.display_name})',
                "price_unit": sale_order_line_browse.price_unit,  
                "currency_id": sale_order_line_browse.currency_id.id,  # Asegúrate de proporcionar la moneda
                "product_uom": product.uom_id.id,  # Asegúrate de proporcionar la unidad de medida
                "company_id": sale_order_line_browse.company_id.id,  # Asegúrate de proporcionar la compañía
                'is_bundle_item': True,
                "sh_bundle_initial_qty": 1,
                # Agrega otros campos necesarios aquí
            })
            if add:
                print(sale_order_line_browse.price_unit)
                add.price_unit = sale_order_line_browse.price_unit
                
                response_data = {"status": "success", "new_line_id": add.id}

                return request.make_response(
                    json.dumps(response_data), [("Content-Type", "application/json")]
                )
            else:
                
                response_data = {
                    "status": "error",
                    "message": "No se pudo crear la línea del pedido. Comuníquese con el administrador del sistema.",
                }

                return request.make_response(
                    json.dumps(response_data), [("Content-Type", "application/json")]
                )
        except Exception as e:
            
            response_data = {
                    "status": "error",
                    "message": f"Hubo un error al crear la línea del pedido: {str(e)}",
                }

            return request.make_response(
                json.dumps(response_data), [("Content-Type", "application/json")]
            )
        
