# Copyright (C) Softhealer Technologies.

from odoo import models, fields, api


class ShProductTemplate(models.Model):
    _inherit = 'product.template'

    sh_bundle_product_ids = fields.One2many(
        comodel_name='sh.product.bundle',
        inverse_name='sh_bundle_id',
        string="Línea de paquete", copy=True, auto_join=True)
    expiration_date = fields.Date(string='Fecha de Expiración')
    sh_is_bundle = fields.Boolean('¿Es un paquete?')
    sh_is_flash = fields.Boolean('¿Es un combo flash?')
    sh_amount_total = fields.Monetary(
        string='Total', store=True, readonly=True, compute='_amount_all')

    @api.model
    def archive_expired_products(self):
        today = fields.Date.today()
        expired_products = self.search([('expiration_date', '<', today), ('active', '=', True)])
        expired_products.write({'active': False})

    @api.depends('sh_bundle_product_ids.sh_price_subtotal')
    def _amount_all(self):
        amount_total = 0.0
        for order in self:
            if order.sh_bundle_product_ids:
                for line in order.sh_bundle_product_ids:
                    amount_total += line.sh_price_subtotal
                order.sh_amount_total = amount_total

    def compute_bundle_price(self):
        list_price = 0.0
        if self.sh_bundle_product_ids:
            for bundle_product in self.sh_bundle_product_ids:
                list_price += bundle_product.sh_price_subtotal
        self.list_price = list_price

    def compute_bundle_cost_price(self):
        standard_price = 0.0
        if self.sh_bundle_product_ids:
            for bundle_product in self.sh_bundle_product_ids:
                standard_price += (bundle_product.sh_cost_price *
                                   bundle_product.sh_qty)
        self.standard_price = standard_price


class Product(models.Model):
    _inherit = 'product.product'

    computed_barcode = fields.Char(string="Código de Barras Calculado", compute="_compute_computed_barcode", store=True)
    sh_is_flash = fields.Boolean(related='product_tmpl_id.sh_is_flash')

    @api.depends('barcode')
    def _compute_computed_barcode(self):
        for product in self:
            product.computed_barcode = product.barcode

    def compute_bundle_price(self):
        lst_price = 0.0
        if self.sh_bundle_product_ids:
            for bundle_product in self.sh_bundle_product_ids:
                lst_price += bundle_product.sh_price_subtotal
        self.lst_price = lst_price

    def compute_bundle_cost_price(self):
        standard_price = 0.0
        if self.sh_bundle_product_ids:
            for bundle_product in self.sh_bundle_product_ids:
                standard_price += (bundle_product.sh_cost_price *
                                   bundle_product.sh_qty)
        self.standard_price = standard_price


class ShBundleProduct(models.Model):
    _name = 'sh.product.bundle'
    _description = 'Productos del Paquete'

    sh_bundle_id = fields.Many2one('product.template', 'ID del Paquete')
    sh_product_id = fields.Many2one(
        'product.product', 'Producto', required=True)
    sh_qty = fields.Float("Cantidad")
    sh_uom = fields.Many2one('uom.uom', 'Unidad de Medida', required=True)
    sh_price_unit = fields.Float('Precio Unitario')
    sh_cost_price = fields.Float(compute="custom_sh_cost_price", )
    sh_price_subtotal = fields.Float('Subtotal', readonly=True, store=True)
    sh_options_bundle_product_ids = fields.Many2many(
        'product.template',
        string="Opciones de Cambio",
    )

    @api.depends('sh_product_id')
    def custom_sh_cost_price(self):
        for record in self:
            record.sh_cost_price = record.sh_product_id.standard_price

    @api.onchange('sh_product_id')
    def _onchange_sh_product_id(self):
        if self.sh_product_id:
            self.sh_uom = self.sh_product_id.uom_id.id
            self.sh_qty = 1.0
            self.sh_price_unit = self.sh_product_id.list_price

    @api.onchange('sh_qty', 'sh_price_unit')
    def get_price_subtotal(self):
        for rec in self:
            rec.sh_price_subtotal = rec.sh_price_unit * rec.sh_qty