from odoo import models, fields


class ResCity(models.Model):
    _inherit = 'res.city'

    is_capital = fields.Boolean(string='Is Capital?', default=False)