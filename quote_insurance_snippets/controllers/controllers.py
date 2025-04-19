from odoo.tools import float_compare
import json
import re
from datetime import datetime, timedelta
from werkzeug.exceptions import Forbidden, NotFound
from werkzeug.urls import url_decode, url_encode, url_parse
from odoo import fields, http, SUPERUSER_ID, tools, _
from odoo.http import request
from odoo.addons.payment import utils as payment_utils
from odoo.tools.json import scriptsafe as json_scriptsafe


class WebsiteController(http.Controller):

    @http.route(
        "/get_countries", type="json", auth="public", methods=["POST"], website=True
    )
    def get_countries(self, **kwargs):
        con = request.env["sale.travel"]
        grupos_edades = request.env["sale.order.ages"].sudo().search([])
        country = con.sudo().search(
            [
                "|",
                ("operation_type", "=", "both"),
                ("operation_type", "=", "origin"),
                ("status", "=", True),
            ]
        )
        destino = con.sudo().search(
            [
                "|",
                ("operation_type", "=", "both"),
                ("operation_type", "=", "destination"),
                ("status", "=", True),
            ]
        )
        destination_country = []
        for count in destino:
            destination_country.append({"id": count.id, "name": count.name})
        origin_country = []
        for count in country:
            origin_country.append({"id": count.id, "name": count.name})
        edades = []
        for edad in grupos_edades:
            edades.append({"id": edad.id, "name": edad.name})
        return {
            "origin_country": origin_country,
            "destination_country": destination_country,
            "edades": edades,
        }

    @http.route(
        "/get_submit_quote", type="json", auth="public", methods=["POST"], website=True
    )
    def get_submit_quote(self, **kwargs):
        if "formData" in kwargs:
            # Deserializar el JSON recibido de JavaScript
            form_data = json.loads(kwargs["formData"])
            trip_type = form_data.get("typeviaje")
            travelers_count = form_data.get("travelers_count")
            email_address = form_data.get("email_address")
            mobile_number = form_data.get("mobile_number")
            group_age = request.env["sale.order.ages"]
            name = ""
            qty = 0
            email_pattern = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
            phone_pattern = re.compile(r"^[0-9]{10}$")
            today = datetime.today().date()
            if not email_address or not email_pattern.match(email_address):
                return {
                    "success": False,
                    "error": "Por favor, ingrese un correo electrónico válido.",
                }
            if not mobile_number or not phone_pattern.match(mobile_number):
                return {
                    "success": False,
                    "error": "Por favor, ingrese un número de teléfono válido (10 dígitos).",
                }
            if trip_type in ["Multidestino", "ida-vuelta", "student"]:
                if trip_type == "Multidestino":
                    productos = (
                        request.env["product.template"]
                        .sudo()
                        .search(
                            [
                                ("categ_id.name", "=", "Multiviajes"),
                                ("active", "=", True),
                            ]
                        )
                    )
                    destinations = []
                    total_quote = 0
                    age_groups = []
                    productos_ids = []
                    for producto in productos:
                        productos_ids.append(
                            {"id": producto.id, "price": producto.list_price}
                        )
                    for key, value in form_data.items():
                        if key.startswith("origin_countryMult["):
                            origin_country = form_data.get(key)
                            destination = form_data.get(
                                "destinationMult[" + key.split("[")[1]
                            )
                            departure_date = form_data.get(
                                "departure_dateMult[" + key.split("[")[1]
                            )
                            return_date = form_data.get(
                                "return_dateMult[" + key.split("[")[1]
                            )
                            try:
                                departure_date = datetime.strptime(
                                    departure_date, "%Y-%m-%d"
                                ).date()
                                return_date = datetime.strptime(
                                    return_date, "%Y-%m-%d"
                                ).date()
                            except ValueError:
                                return {
                                    "success": False,
                                    "error": "Por favor, ingrese fechas válidas.",
                                }

                            if departure_date < today:
                                return {
                                    "success": False,
                                    "error": "La fecha de salida no puede ser anterior a hoy.",
                                }

                            if return_date <= departure_date:
                                return {
                                    "success": False,
                                    "error": "La fecha de retorno debe ser posterior a la fecha de salida.",
                                }
                            destinations.append(
                                {
                                    "origin_country": origin_country,
                                    "destination": destination,
                                    "departure_date": departure_date,
                                    "return_date": return_date,
                                }
                            )

                        if key.startswith("person["):
                            qty += int(value)
                            age_groups.append(
                                {
                                    "id": int(key.split("[")[1].split("]")[0]),
                                    "cant": int(value),
                                }
                            )
                    origin_country_ids = []
                    destination_ids = []
                    departure_date_ = []
                    return_date_ = []
                    calculate = []
                    for destination in destinations:
                        origin_country_ids.append(destination["origin_country"])
                        destination_ids.append(destination["destination"])
                        departure_date_.append(destination["departure_date"])
                        return_date_.append(destination["return_date"])
                        calculate.append(
                            self._calculate_quote(
                                destination, age_groups, qty, productos_ids
                            )
                        )

                    final_calculate = self._unify_calculate(calculate)
                    data = (
                        request.env["sale.order.temp"]
                        .sudo()
                        .create(
                            {
                                "quote_details": json.dumps(
                                    final_calculate
                                ),  # Guarda la lista de cotizaciones como un JSON
                                "origin_country": origin_country_ids,
                                "destination": destination_ids,
                                "departure_date": departure_date_,
                                "return_date": return_date_,
                                "travelers_count": travelers_count,
                                "email_address": email_address,
                                "mobile_number": mobile_number,
                                "trip_type": trip_type,
                                "data_set": calculate,
                            }
                        )
                    )
                    return {"success": True, "data": data.id}

                elif trip_type in ["ida-vuelta", "student"]:
                    if trip_type == "student":
                        productos = (
                            request.env["product.template"]
                            .sudo()
                            .search(
                                [
                                    ("categ_id.name", "=", "Planes Estudiantiles"),
                                    ("active", "=", True),
                                ]
                            )
                        )
                    else:
                        productos = (
                            request.env["product.template"]
                            .sudo()
                            .search(
                                [
                                    ("categ_id.name", "=", "Planes Básicos"),
                                    ("active", "=", True),
                                ]
                            )
                        )

                    destinations = []
                    total_quote = 0
                    age_groups = []
                    productos_ids = []
                    for producto in productos:
                        productos_ids.append(
                            {"id": producto.id, "price": producto.list_price}
                        )

                    for key, value in form_data.items():
                        origin_country = form_data.get("origin_country")
                        destination = form_data.get("destination")
                        departure_date = form_data.get("departure_date")
                        return_date = form_data.get("return_date")
                        try:
                            departure_date = datetime.strptime(
                                departure_date, "%Y-%m-%d"
                            ).date()
                            return_date = datetime.strptime(
                                return_date, "%Y-%m-%d"
                            ).date()
                        except ValueError:
                            return {
                                "success": False,
                                "error": "Por favor, ingrese fechas válidas.",
                            }

                        if departure_date < today:
                            return {
                                "success": False,
                                "error": "La fecha de salida no puede ser anterior a hoy.",
                            }

                        if return_date <= departure_date:
                            return {
                                "success": False,
                                "error": "La fecha de retorno debe ser posterior a la fecha de salida.",
                            }

                        destinations.append(
                            {
                                "origin_country": origin_country,
                                "destination": destination,
                                "departure_date": departure_date,
                                "return_date": return_date,
                            }
                        )

                        if key.startswith("person["):
                            qty += int(value)
                            age_groups.append(
                                {
                                    "id": int(key.split("[")[1].split("]")[0]),
                                    "cant": int(value),
                                }
                            )

                    origin_country_ids = []
                    destination_ids = []
                    departure_date_ = []
                    return_date_ = []
                    calculate = []

                    calculate.append(
                        self._calculate_quote(
                            {
                                "origin_country": origin_country,
                                "destination": destination,
                                "departure_date": departure_date,
                                "return_date": return_date,
                            },
                            age_groups,
                            qty,
                            productos_ids,
                        )
                    )

                    final_calculate = self._unify_calculate(calculate)

                    data = (
                        request.env["sale.order.temp"]
                        .sudo()
                        .create(
                            {
                                "quote_details": json.dumps(
                                    final_calculate
                                ),  # Guarda la lista de cotizaciones como un JSON
                                "origin_country": origin_country_ids,
                                "destination": destination_ids,
                                "departure_date": departure_date_,
                                "return_date": return_date_,
                                "travelers_count": travelers_count,
                                "email_address": email_address,
                                "mobile_number": mobile_number,
                                "trip_type": trip_type,
                                "data_set": calculate,
                            }
                        )
                    )
                    return {"success": True, "data": data.id}

            elif trip_type == "anual":
                today = datetime.today()
                one_year_from_now = today + timedelta(days=365)
                departure_date_str = form_data.get("departure_date")
                return_date_str = form_data.get("return_date")
                productos = (
                    request.env["product.template"]
                    .sudo()
                    .search(
                        [
                            ("categ_id.name", "=", "Planes Anuales"),
                            ("active", "=", True),
                        ]
                    )
                )
                try:
                    departure_date = (
                        datetime.strptime(departure_date_str, "%Y-%m-%d")
                        if departure_date_str
                        else today
                    )
                except ValueError:
                    departure_date = today

                try:
                    return_date = (
                        datetime.strptime(return_date_str, "%Y-%m-%d")
                        if return_date_str
                        else one_year_from_now
                    )
                except ValueError:
                    return_date = one_year_from_now
                if departure_date < today:
                    departure_date = today
                if return_date > one_year_from_now:
                    return_date = one_year_from_now
                plan_duration_years = (return_date - departure_date).days // 365
                plan_name = f"Plan Anual desde {departure_date.strftime('%Y-%m-%d')} hasta {return_date.strftime('%Y-%m-%d')}"
                if plan_duration_years > 1:
                    plan_name = f"Plan de {plan_duration_years} años desde {departure_date.strftime('%Y-%m-%d')} hasta {return_date.strftime('%Y-%m-%d')}"
                productos_ids = []
                for producto in productos:
                    productos_ids.append(
                        {
                            "product_id": producto.id,
                            "total_price": producto.list_price,
                            "name": plan_name,
                        }
                    )
                data = (
                    request.env["sale.order.temp"]
                    .sudo()
                    .create(
                        {
                            "quote_details": json.dumps(productos_ids),
                            "origin_country": [form_data.get("origin_country")],
                            "destination": [form_data.get("destination")],
                            "departure_date": departure_date.strftime("%Y-%m-%d"),
                            "return_date": return_date.strftime("%Y-%m-%d"),
                            "travelers_count": travelers_count,
                            "email_address": email_address,
                            "mobile_number": mobile_number,
                            "trip_type": trip_type,
                            # "data_set": calculate,
                        }
                    )
                )
                return {"success": True, "data": data.id}

    def _unify_calculate(self, calculate):
        product_quotes = {}

        for calc in calculate:
            for item in calc:
                # Si el producto ya existe en el diccionario, sumamos el total y actualizamos el nombre
                if item["product_id"] in product_quotes:
                    product_quotes[item["product_id"]]["total_price"] += item[
                        "total_price"
                    ]
                    # Formateamos correctamente el nombre
                    original_name = product_quotes[item["product_id"]]["name"]
                    base_name = original_name.split("Costo:")[
                        0
                    ]  # Tomamos la parte antes de 'Costo:'
                    product_quotes[item["product_id"]][
                        "name"
                    ] = f"{base_name}Costo: {product_quotes[item['product_id']]['total_price']:.2f}\n"
                else:
                    product_quotes[item["product_id"]] = item

        return list(product_quotes.values())

    def _calculate_quote(self, destination, age_groups, qty, productos_ids):

        origin_country_id = destination.get("origin_country")
        destination_id = destination.get("destination")
        departure_date = destination.get("departure_date")
        return_date = destination.get("return_date")
        days_difference = (return_date - departure_date).days + 1

        origin_country = (
            request.env["sale.travel"].sudo().browse(int(origin_country_id))
        )
        destination = request.env["sale.travel"].sudo().browse(int(destination_id))
        origin_list_price = float(origin_country.origen)
        destination_list_price = float(destination.destination)
        quote_total = origin_list_price + destination_list_price

        product_quotes = []

        for item in productos_ids:
            price = item["price"] + quote_total * days_difference

            # Reiniciar total_price para cada producto
            total_price = 0

            for age in age_groups:
                group_ages = (
                    request.env["sale.order.ages"].sudo().browse(int(age["id"]))
                )
                age_total = 0

                for group_age in group_ages:
                    adjusted_price = price

                    if group_age.operation_type == "discount":
                        if group_age.type_discount == "fixed":
                            adjusted_price -= group_age.operation
                        else:
                            adjusted_price -= (price * group_age.operation) / 100
                    else:
                        if group_age.type_discount == "fixed":
                            adjusted_price += group_age.operation
                        else:
                            adjusted_price += (price * group_age.operation) / 100

                    age_total += adjusted_price

                # Multiplicamos por la cantidad de personas en este grupo
                if int(age["cant"]):
                    total_price += age_total * int(age["cant"])

            # Ajustar el nombre con el costo final calculado
            name = f"Origen: {origin_country.name}, Destino: {destination.name} Cantidad De Persona: {qty} Costo: {total_price:.2f}\n"
            product_quotes.append(
                {
                    "product_id": item["id"],
                    "total_price": total_price,
                    "name": name,
                }
            )

        return product_quotes

    @http.route("/pag_plan", type="http", auth="public", website=True)
    def pag_plan(self, **kwargs):
        # Obtener el ID de la solicitud de la URL
        plan_id = request.params.get("id")
        # Obtener los datos del plan con el ID obtenido
        plan = request.env["sale.order.temp"].sudo().browse(int(plan_id))
        if plan.trip_type == "anual":
            productos = (
                request.env["product.template"]
                .sudo()
                .search(
                    [("categ_id.name", "=", "Planes Anuales"), ("active", "=", True)]
                )
            )
        elif plan.trip_type == "student":
            productos = (
                request.env["product.template"]
                .sudo()
                .search(
                    [
                        ("categ_id.name", "=", "Planes Estudiantiles"),
                        ("active", "=", True),
                    ]
                )
            )
        else:
            productos = (
                request.env["product.template"]
                .sudo()
                .search(
                    [("categ_id.name", "=", "Planes Básicos"), ("active", "=", True)]
                )
            )
        product_quotes = json.loads(plan.quote_details)
        product_quotes_dict = {quote["product_id"]: quote for quote in product_quotes}
        productos_data = []
        for producto in productos:
            plan_cobertura_recs = (
                request.env["sh.product.bundle"]
                .sudo()
                .search([("sh_bundle_id", "=", producto.id)])
            )
            coberturas_data = []
            for plan_cobertura in plan_cobertura_recs:
                cobertura_data = {
                    "name": plan_cobertura.sh_product_id.name,
                    "scopes": plan_cobertura.sh_quote,
                    "condicion": list(
                        map(
                            lambda condicion: condicion.name,
                            plan_cobertura.sh_condicion,
                        )
                    ),
                }
                coberturas_data.append(cobertura_data)
            quote = product_quotes_dict.get(producto.id)
            list_price = format(quote["total_price"], ".2f")

            name = producto.name

            producto_data = {
                "id": producto.id,
                "name": name,
                "description": producto.description_sale,
                "image_url": producto.image_1920,
                "list_price": list_price,
                "coberturas": coberturas_data,
            }
            productos_data.append(producto_data)

        return http.request.render(
            "quote_insurance_snippets.template_pag_plan",
            {
                "plan": plan.id,
                "productos": productos_data,
            },
        )

    @http.route(
        ["/shop/cart/update_json_qu"],
        type="json",
        auth="public",
        methods=["POST"],
        website=True,
        csrf=False,
    )
    def cart_update_json(
        self,
        product_id,
        line_id=None,
        add_qty=None,
        set_qty=None,
        display=True,
        product_custom_attribute_values=None,
        no_variant_attribute_values=None,
        productPrice=None,
        planId=None,
        **kw,
    ):
        product_product = request.env["product.product"].search(
            [("product_tmpl_id", "=", product_id)],
            limit=1,
        )
        if product_product:
            product_id = product_product.id

        product_quotes = []
        product_quotes_dict = {}
        quote = None

        if planId and str(planId).isdigit():
            plan = request.env["sale.order.temp"].sudo().browse(int(planId))
            if plan.exists() and plan.quote_details:
                try:
                    product_quotes = json.loads(plan.quote_details)
                    product_quotes_dict = {
                        quote["product_id"]: quote for quote in product_quotes
                    }
                    quote = product_quotes_dict.get(product_id)
                    print(f"Data set for plan {planId}: {(plan.data_set)}")
                except Exception as e:
                    print("Error parsing quote_details JSON: %s", e)

        # Puedes descomentar estas líneas para depurar
        print("QUOTE:", quote)
        print("PRODUCT_QUOTES_DICT:", product_quotes_dict)

        order = request.website.sale_get_order(force_create=True, update_pricelist=True)
        if order.state != "draft":
            request.website.sale_reset()
            if kw.get("force_create"):
                order = request.website.sale_get_order(
                    force_create=True, update_pricelist=True
                )
            else:
                return {}

        if product_custom_attribute_values:
            product_custom_attribute_values = json_scriptsafe.loads(
                product_custom_attribute_values
            )

        if no_variant_attribute_values:
            no_variant_attribute_values = json_scriptsafe.loads(
                no_variant_attribute_values
            )

        values = order._cart_update(
            product_id=product_id,
            line_id=line_id,
            add_qty=add_qty,
            price=quote["total_price"],
            set_qty=set_qty,
            product_custom_attribute_values=product_custom_attribute_values,
            no_variant_attribute_values=no_variant_attribute_values,
            **kw,
        )

        if line_id:
            order_line = request.env["sale.order.line"].sudo().browse(line_id)
        else:
            order_line = order.order_line.filtered(
                lambda line: line.product_id.id == product_id
            )

        if quote is not None and quote.get("name") and order_line:
            for line in order_line:
                line.name = quote["name"]
                line.price_unit = quote["total_price"]

        request.session["website_sale_cart_quantity"] = order.cart_quantity

        if not order.cart_quantity:
            request.website.sale_reset()
            return values

        values["cart_quantity"] = order.cart_quantity
        values["minor_amount"] = payment_utils.to_minor_currency_units(
            order.amount_total, order.currency_id
        )

        if not display:
            return values

        # Render de las líneas del carrito y total
        values["website_sale.cart_lines"] = request.env["ir.ui.view"]._render_template(
            "website_sale.cart_lines",
            {
                "website_sale_order": order,
                "date": fields.Date.today(),
                "suggested_products": order._cart_accessories(),
            },
        )

        values["website_sale.total"] = request.env["ir.ui.view"]._render_template(
            "website_sale.total",
            {
                "website_sale_order": order,
            },
        )

        return values
