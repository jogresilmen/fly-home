from odoo import models, fields, api


class ProductCode(models.Model):
    _inherit = 'product.template'

 
    codigo = fields.Char(
        string='codigo',
    )

    
    def _compute_prices_from_coverages(self):
        for product in self:
            coberturas = self.env['sh.product.bundle'].search([('sh_bundle_id','=',product.id)])
            total_cost = sum(cobertura.sh_cost_price for cobertura in coberturas)
            total_price = sum(cobertura.sh_price_unit for cobertura in coberturas)
            product.standard_price = total_cost
            product.list_price = total_price

    @api.model
    def update_product_prices(self):
        products = self.search([])
        for product in products:
            product._compute_prices_from_coverages()

    