from odoo import models, fields, api, _
from odoo.exceptions import UserError


class ShProductBundleWizard(models.TransientModel):
    _name = "sh.product.bundle.wizard"
    _description = "Asistente de Paquete"

    sh_partner_id = fields.Many2one("res.partner", "Cliente", required=True)
    sh_bundle_id = fields.Many2one(
        "product.template",
        "Agregar Paquete / Combo",
        required=True,
        domain=[("sh_is_bundle", "=", True)],
    )
    sh_qty = fields.Integer("Cantidad", default=1, required=True)
    sh_price = fields.Float("Precio del Paquete / Combo")
    sh_bundle_lines = fields.One2many(
        "sh.product.bundle.wizard.line", "wizard_id", string="Líneas del Paquete"
    )

    tag_sh_product_id_tr = fields.Char()

    @api.onchange("sh_qty")
    def onchange_bundle_line(self):

        self.sh_price = self.sh_bundle_id.list_price * self.sh_qty
        if self.sh_bundle_id and self.sh_bundle_id.sh_bundle_product_ids:
            line_ids = []
            self.sh_bundle_lines = False
            for line in self.sh_bundle_id.sh_bundle_product_ids:

                line_vals = {
                    "sh_product_id": line.sh_product_id.id,
                    "sh_bundle_quantity": line.sh_qty * self.sh_qty,
                    "sh_bundle_uom": line.sh_uom.id,
                    "sh_price_unit": line.sh_price_unit,  # Agregado
                    "sh_bundle_id": line.id,
                }
                line_ids.append((0, 0, line_vals))
            self.sh_bundle_lines = line_ids

    @api.onchange("sh_bundle_id")
    def onchange_bundle(self):

        if self.sh_bundle_id:
            self.sh_price = self.sh_bundle_id.list_price * self.sh_qty
            if self.sh_bundle_id.sh_bundle_product_ids:
                line_ids = []
                self.sh_bundle_lines = False
                tag_sh_product_id_list = []
                for line in self.sh_bundle_id.sh_bundle_product_ids:
                    tag_sh_product_id = []
                    for i in line.sh_options_bundle_product_ids:
                        tag_sh_product_id.append(i.id)
                        tag_sh_product_id_list.append(i.id)

                    line_vals = {
                        "sh_product_id": line.sh_product_id.id,
                        "sh_bundle_quantity": line.sh_qty,
                        "sh_bundle_uom": line.sh_uom.id,
                        "sh_price_unit": line.sh_price_unit,  # Agregado
                        "sh_bundle_id": line.id,
                        "tag_sh_product_id": tag_sh_product_id,
                    }
                    line_ids.append((0, 0, line_vals))
                self.sh_bundle_lines = line_ids
                self.tag_sh_product_id_tr = tag_sh_product_id_list

    def action_add_pack(self):

        QTY = self.env["sh.product.bundle"].search(
            [("sh_bundle_id", "=", self.sh_bundle_id.id)]
        )
        pecio = 0
        cantidad = 0
        for qt in QTY:
            cantidad = cantidad + qt.sh_qty
            pecio = pecio + (qt.sh_price_unit * qt.sh_qty)

        context = self.env.context
        if context.get("active_model") == "sale.order":
            sale_order = (
                self.env["sale.order"]
                .sudo()
                .search([("id", "=", context.get("active_id"))], limit=1)
            )
            if sale_order and self.sh_bundle_lines:
                product_lines = []
                cantidad2 = 0
                pecio2 = 0
                for line in self.sh_bundle_lines:
                    cantidad2 = cantidad2 + line.sh_bundle_quantity
                    product_lines.append(
                        (
                            0,
                            0,
                            {
                                "order_id": sale_order.id,
                                "product_id": line.sh_product_id.id,
                                "name": f"{line.sh_product_id.name}-({self.sh_bundle_id.name})",
                                # "product_uom": line.sh_bundle_uom.id,
                                "product_uom_qty": line.sh_bundle_quantity,
                                "price_unit": line.sh_price_unit,  # Agregado
                                "sh_bundle_id": line.sh_bundle_id,
                            },
                        )
                    )
                    pecio2 = pecio2 + (line.sh_price_unit * line.sh_bundle_quantity)

                # if pecio2 > pecio:
                    # raise UserError(_("los precios sobre pasan los el valor del combo"))

                # if cantidad < cantidad2:
                    # raise UserError(
                        # _(
                            # "la cantidad de items sobrepasa la cantidad permitida en el producto "
                        # )
                    # )
                sale_order.order_line = product_lines
        elif context.get("active_model") == "stock.picking":
            picking_id = (
                self.env["stock.picking"]
                .sudo()
                .search([("id", "=", context.get("active_id"))], limit=1)
            )
            src_location, dest_location = None, None
            if picking_id.picking_type_code == "incoming":
                src_location = self.env.ref("stock.stock_location_suppliers")
                dest_location = self.env.ref("stock.stock_location_stock")
            elif picking_id.picking_type_code == "outgoing":
                src_location = self.env.ref("stock.stock_location_stock")
                dest_location = self.env.ref("stock.stock_location_customers")
            elif picking_id.picking_type_code == "internal":
                src_location = picking_id.location_id
                dest_location = picking_id.location_dest_id
            if picking_id and self.sh_bundle_lines:
                product_lines = []
                for line in self.sh_bundle_lines:
                    product_lines.append(
                        (
                            0,
                            0,
                            {
                                "picking_id": picking_id.id,
                                "location_id": src_location.id,
                                "location_dest_id": dest_location.id,
                                "name": line.sh_product_id.name,
                                "product_id": line.sh_product_id.id,
                                "product_uom": line.sh_bundle_uom.id,
                                "product_uom_qty": line.sh_bundle_quantity,
                                "state": "draft",
                            },
                        )
                    )
                picking_id.move_ids_without_package = product_lines
        elif context.get("active_model") == "purchase.order":
            purchase_order = (
                self.env["purchase.order"]
                .sudo()
                .search([("id", "=", context.get("active_id"))], limit=1)
            )
            if purchase_order and self.sh_bundle_lines:
                product_lines = []
                for line in self.sh_bundle_lines:
                    product_lines.append(
                        (
                            0,
                            0,
                            {
                                "order_id": purchase_order.id,
                                "product_id": line.sh_product_id.id,
                                "name": line.sh_product_id.name,
                                "date_planned": fields.Datetime.now(),
                                "product_uom": line.sh_bundle_uom.id,
                                "product_qty": line.sh_bundle_quantity,
                                "price_unit": line.sh_product_id.standard_price,
                            },
                        )
                    )
                purchase_order.order_line = product_lines


class ShProductBundleWizardLine(models.TransientModel):
    _name = "sh.product.bundle.wizard.line"
    _description = "Línea del Asistente de Paquete de Productos"

    sh_bundle_id = fields.Many2one(
        "sh.product.bundle",
        string="Paquete",
    )
    tag_sh_product_id = fields.Many2many(
        "product.template", compute="_compute_tag_sh_product_id"
    )
    wizard_id = fields.Many2one("sh.product.bundle.wizard", string="Asistente")
    sh_product_id = fields.Many2one(
        "product.product",
        string="Producto",
    )

    sh_bundle_quantity = fields.Float("Cantidad")
    sh_bundle_uom = fields.Many2one("uom.uom", string="Unidad de Medida")
    sh_price_unit = fields.Float("Precio Unitario")  # Agregado

    @api.depends("wizard_id")
    def _compute_tag_sh_product_id(self):
        for record in self:
            if not record.tag_sh_product_id:
                list = self.env["sh.product.bundle"].search(
                    [("sh_bundle_id", "=", record.wizard_id.sh_bundle_id.id)]
                )
                list_ids = []
                for item in list:
                    list_ids.append(item.sh_product_id.product_tmpl_id.id)
                    for ids in list.sh_options_bundle_product_ids:
                        list_ids.append(ids.id)
                record.tag_sh_product_id = list_ids