from odoo import models, fields, api


class ProductSintomasCobertura(models.Model):
    _name = 'product.sintomas.cobertura'

    name = fields.Char(string='Sintomas', required=True)
    categoria_id = fields.Many2one(string='Categoria', comodel_name='product.categoria.cobertura', ondelete='restrict')

class ProductCategorianCobertura(models.Model):
    _name = 'product.categoria.cobertura'


    name = fields.Char(string='Problemas', required=True)
    sintoma_ids = fields.One2many(string='',comodel_name='product.sintomas.cobertura',inverse_name='categoria_id' )

class ProductPlanCoberturaCate(models.Model):
    _name = 'product.cobertura.categoria'

    name = fields.Char(string='Cobertura', required=True)

class ProductPlanCoberturaName(models.Model):
    _name = 'product.cobertura'

    name = fields.Char(string='Cobertura', required=True)
    categoria = fields.Many2one(string='categorías ', comodel_name='product.cobertura.categoria', ondelete='restrict')

class ProductPlanCoberturaName(models.Model):
    _name = 'product.condicion'

    name = fields.Char(string='Nombre de la condición', required=True)
   

class ProductPlanCobertura(models.Model):
    _name = 'product.plan.cobertura'

    name = fields.Many2one(string='Nombre', comodel_name='product.cobertura', ondelete='restrict')
    categoria = fields.Many2many(string='categorías', comodel_name='product.cobertura.categoria', ondelete='restrict')
    montos = fields.Monetary(currency_field='currency_id', string='Monto de cobertura', required=True)
    product_ids = fields.Many2many('product.template', string='Productos', widget='many2many_tags')
    operation_type = fields.Selection([('asset', 'Activo'), ('idle', 'Inactivo')], string='Estatus', required=True)
    currency_id = fields.Many2one('res.currency', string='Currency', required=True, default=lambda self: self.env.user.company_id.currency_id.id)
    condicion = fields.Many2many('product.condicion', string="Condicion")
    cost = fields.Monetary(currency_field='currency_id',string='Costo',required=True, default=0)
    prist_list = fields.Monetary(currency_field='currency_id',string='Precio para la venta', required=True,default=0)
    Clasificación_id = fields.Many2many(string='Clasificación - Sintomas', comodel_name='product.categoria.cobertura', ondelete='restrict')

    @api.model
    def create(self, vals):
        record = super(ProductPlanCobertura, self).create(vals)
        record._update_product_costs_and_prices()
        return record

    def write(self, vals):
        res = super(ProductPlanCobertura, self).write(vals)
        self._update_product_costs_and_prices()
        return res

    def unlink(self):
        products = self.mapped('product_ids')
        res = super(ProductPlanCobertura, self).unlink()
        for product in products:
            product._compute_prices_from_coverages()
        return res

    @api.constrains('product_ids', 'cost', 'prist_list')
    def _update_product_costs_and_prices(self):
        for record in self:
            for product in record.product_ids:
                product._compute_prices_from_coverages()
            