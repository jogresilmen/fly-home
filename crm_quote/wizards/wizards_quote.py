from odoo import fields, models, api
from odoo.exceptions import ValidationError
from datetime import date

# from odoo.exceptions import UserError # Importar si usas raise UserError


class CrmQuoteAgeLine(models.TransientModel):
    """
    Modelo transitorio para representar una línea de cantidad por grupo de edad
    dentro del asistente de cotización CRM.
    """

    _name = "crm.quote.age.line"
    _description = "Asistente CRM - Cantidad por Grupo de Edad"

    # --- CAMBIO: Eliminar el campo Many2one inverso ---
    quote_id = fields.Many2one("crm.quote", string="Cotización Asistente")
    # -------------------------------------------------

    edad_id = fields.Many2one(
        "sale.order.ages",
        string="Grupo de Edad",
    )
    cantidad = fields.Integer(string="Cantidad", default=0)


class CrmQuoteTripLine(models.TransientModel):
    _name = "crm.quote.trip.line"
    _description = "Detalle de Viaje para Cotización CRM"

    quote_id = fields.Many2one("crm.quote", string="Cotización Asistente")
    origen_id = fields.Many2one(
        "sale.travel",
        string="Origen",
    )
    destino_id = fields.Many2one(
        "sale.travel",
        string="Retorno",
    )
    fecha_salida = fields.Date(
        string="Fecha de Salida",
    )
    fecha_retorno = fields.Date(
        string="Fecha de Retorno",
    )

    @api.onchange("fecha_salida", "fecha_retorno")
    def _onchange_fechas(self):
        if self.fecha_salida and self.fecha_salida < date.today():
            return {
                "warning": {
                    "title": "Fecha inválida",
                    "message": "La fecha de salida no puede ser anterior a hoy.",
                }
            }
        if (
            self.fecha_salida
            and self.fecha_retorno
            and self.fecha_retorno < self.fecha_salida
        ):
            return {
                "warning": {
                    "title": "Fecha inválida",
                    "message": "La fecha de retorno no puede ser anterior a la salida.",
                }
            }


class CrmQuote(models.TransientModel):
    """
    Asistente para generar cotizaciones CRM basado en origen, destino,
    categoría de plan y cantidades por grupo de edad.
    """

    _name = "crm.quote"
    _description = "Asistente de Cotización CRM"

    type_plan_id = fields.Many2one(
        "product.category",
        string="Categoría de Planes",
        domain=[("is_plan", "=", True)],
    )
    origen_id = fields.Many2one(string="Origen", comodel_name="sale.travel")
    destinos = fields.Many2one(string="Retorno", comodel_name="sale.travel")
    # La definición del One2many se mantiene igual, especificando el nombre
    # del campo inverso que Odoo debe usar (aunque ya no exista explícitamente)
    edades_ids = fields.One2many(
        "crm.quote.age.line",
        "quote_id",  # Mantener este nombre es importante
        string="Grupos de Edades",
    )
    is_plan_category = fields.Boolean(related="type_plan_id.is_plan", store=True)
    order_id = fields.Many2one("sale.order", string="Oportunidad Relacionada")
    viaje_ids = fields.One2many("crm.quote.trip.line", "quote_id", string="Viajes")

    show_multiviajes = fields.Boolean(
        string="¿Mostrar sección Multiviajes?",
        compute="_onchange_type_plan_id",
        store=False,
    )

    fecha_salida_sim = fields.Date(
        string="Fecha de Salida",
    )
    fecha_retorno_sim = fields.Date(
        string="Fecha de Retorno",
    )

    @api.onchange("fecha_salida", "fecha_retorno")
    def _onchange_fechas(self):
        if self.fecha_salida and self.fecha_salida < date.today():
            return {
                "warning": {
                    "title": "Fecha inválida",
                    "message": "La fecha de salida no puede ser anterior a hoy.",
                }
            }
        if (
            self.fecha_salida
            and self.fecha_retorno
            and self.fecha_retorno < self.fecha_salida
        ):
            return {
                "warning": {
                    "title": "Fecha inválida",
                    "message": "La fecha de retorno no puede ser anterior a la salida.",
                }
            }

    @api.onchange("type_plan_id")
    def _onchange_type_plan_id(self):
        if self.type_plan_id.is_plan and self.type_plan_id.type_plan == "multiviajes":
            self.show_multiviajes = True
        else:
            self.show_multiviajes = False

    @api.model
    def default_get(self, fields_list):
        """Carga los grupos de edad por defecto al abrir el asistente."""
        res = super().default_get(fields_list)
        res["edades_ids"] = self._prepare_default_edad_lines()
        return res

    def _prepare_default_edad_lines(self):
        """Prepara los comandos para crear las líneas de edad por defecto."""
        edades_lines_commands = []
        grupos = self.env["sale.order.ages"].search([])
        for grupo in grupos:
            # Ya no incluimos 'quote_id' aquí tampoco
            edades_lines_commands.append((0, 0, {"edad_id": grupo.id, "cantidad": 0}))
        return edades_lines_commands

    # -------------------------------------------------------------
    def action_cotizar(self):
        self.ensure_one()

        if not self.type_plan_id:
            raise ValidationError("Debes seleccionar una categoría de plan.")

        if not any(line.cantidad > 0 for line in self.edades_ids):
            raise ValidationError(
                "Debes ingresar al menos una cantidad en grupos de edad."
            )

        is_multiviajes = self.type_plan_id.is_multi

        if is_multiviajes:
            if not self.viaje_ids:
                raise ValidationError("Debes ingresar al menos un viaje.")
            for viaje in self.viaje_ids:
                if viaje.fecha_salida < date.today():
                    raise ValidationError(
                        "La fecha de salida no puede ser anterior a hoy."
                    )
                if viaje.fecha_retorno < viaje.fecha_salida:
                    raise ValidationError(
                        "La fecha de retorno no puede ser anterior a la salida."
                    )
            viajes = self.viaje_ids
        else:
            if not self.origen_id or not self.destinos:
                raise ValidationError("Debes seleccionar un origen y un destino.")
            if not self.fecha_salida_sim or not self.fecha_retorno_sim:
                raise ValidationError("Debes ingresar fechas de salida y retorno.")
            if self.fecha_salida_sim < date.today():
                raise ValidationError("La fecha de salida no puede ser anterior a hoy.")
            if self.fecha_retorno_sim < self.fecha_salida_sim:
                raise ValidationError(
                    "La fecha de retorno no puede ser anterior a la salida."
                )
            viajes = [
                self.env["crm.quote.trip.line"].new(
                    {
                        "origen_id": self.origen_id.id,
                        "destino_id": self.destinos.id,
                        "fecha_salida": self.fecha_salida_sim,
                        "fecha_retorno": self.fecha_retorno_sim,
                    }
                )
            ]

        productos = self.env["product.template"].search(
            [
                ("categ_id", "=", self.type_plan_id.id),
                ("sale_ok", "=", True),
                ("active", "=", True),
            ]
        )
        if not productos:
            raise ValidationError("No se encontraron productos en esta categoría.")

        productos_resultado = []

        for producto in productos:
            total_producto = 0

            for viaje in viajes:
                dias = (viaje.fecha_retorno - viaje.fecha_salida).days + 1
                origen_precio = float(viaje.origen_id.origen or 0)
                destino_precio = float(viaje.destino_id.destination or 0)
                costo_base = origen_precio + destino_precio
                precio_base = producto.list_price + (costo_base * dias)

                for edad_line in self.edades_ids:
                    if edad_line.cantidad <= 0:
                        continue

                    regla = edad_line.edad_id
                    precio_modificado = precio_base

                    if regla.operation_type == "discount":
                        if regla.type_discount == "fixed":
                            precio_modificado -= regla.operation
                        elif regla.type_discount == "percentage":
                            precio_modificado -= precio_base * regla.operation / 100
                    elif regla.operation_type == "increase":
                        if regla.type_discount == "fixed":
                            precio_modificado += regla.operation
                        elif regla.type_discount == "percentage":
                            precio_modificado += precio_base * regla.operation / 100

                    total_producto += precio_modificado * edad_line.cantidad

            productos_resultado.append(
                (0, 0, {"product_id": producto.id, "precio_final": total_producto})
            )

        # Crear el wizard de selección de producto cotizado
        wizard = self.env["crm.quote.result.wizard"].create(
            {
                "producto_line_ids": productos_resultado,
                "order_id": self.order_id.id,
            }
        )

        return {
            "name": "Seleccionar Producto Cotizado",
            "type": "ir.actions.act_window",
            "res_model": "crm.quote.result.wizard",
            "res_id": wizard.id,
            "view_mode": "form",
            "target": "new",
        }


class CrmQuoteResultWizard(models.TransientModel):
    _name = "crm.quote.result.wizard"
    _description = "Resultado de Cotización"

    producto_line_ids = fields.One2many(
        "crm.quote.result.line", "wizard_id", string="Productos Cotizados"
    )
    order_id = fields.Many2one("sale.order", string="Oportunidad Relacionada")

    def action_confirmar_producto(self):
        self.ensure_one()

        seleccionados = self.producto_line_ids.filtered(lambda l: l.selection)

        if not seleccionados:
            raise ValidationError("Debes seleccionar un producto para continuar.")
        if len(seleccionados) > 1:
            raise ValidationError("Solo puedes seleccionar un producto.")

        producto = seleccionados[0]

        if self.order_id:
            self.env["sale.order.line"].create({
                "order_id": self.order_id.id,
                "product_id": producto.product_id.id,
                "product_uom_qty": 1,
                "price_unit": producto.precio_final,
            })

        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": "Producto seleccionado",
                "message": f"Has seleccionado: {producto.product_id.name} por ${producto.precio_final:.2f}",
                "type": "success",
                "sticky": False, 
                "next": {"type": "ir.actions.act_window_close"},  # 🔒 Cierra el modal
            },
        }


class CrmQuoteResultLine(models.TransientModel):
    _name = "crm.quote.result.line"
    _description = "Línea de Producto Cotizado"

    wizard_id = fields.Many2one("crm.quote.result.wizard", string="Wizard")
    product_id = fields.Many2one("product.product", string="Producto")
    precio_final = fields.Float(string="Precio Final")
    selection = fields.Boolean(default=False)
    order_id = fields.Many2one("sale.order", string="Oportunidad Relacionada")

    api.onchange("selection")

    def _onchange_selection(self):
        if self.selection:
            for line in self.wizard_id.producto_line_ids:
                if line != self:
                    line.selection = False

    def name_get(self):
        result = []
        for record in self:
            name = f"{record.product_id.display_name} - {record.precio_final:.2f}"
            result.append((record.id, name))
        return result
