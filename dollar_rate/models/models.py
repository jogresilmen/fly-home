import requests
from bs4 import BeautifulSoup
from odoo import models, fields, api
from datetime import datetime, date,timedelta
from datetime import date
from odoo.exceptions import UserError
import pytz

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Aquí agregarás el campo para el monto en dólares
    dollar_price = fields.Float(string='Precio en $', digits=(16, 2))
    list_price = fields.Float(string='Precio en Bs.', digits=(16, 2), compute='_calculate_price_bs')

    @api.depends('dollar_price')
    def _calculate_price_bs(self):
        currency = self.env.ref("base.USD")
        rate_currency = currency._get_conversion_rate(
            self.currency_id, currency, self.env.company, fields.Date.today()
        )
        for rec in self:
            rec.list_price = rec.dollar_price / rate_currency

class DollarRate(models.Model):
    _name = 'dollar.rate'
    _description = 'Dollar Rate'

    value = fields.Float(string='Value', digits=(10, 2))

    @api.model
    def _cron_update_dollar_rate(self):
        tz = pytz.timezone('America/Caracas')
        now = datetime.now(tz)
        current_datetime = now.strftime('%H:%M:%S')
        if (current_datetime > "04:59:00" and current_datetime < "05:10:00") or (current_datetime > "16:59:00" and current_datetime < "17:10:00"):
            url = 'https://www.bcv.org.ve/'
            response = requests.get(url, verify=False)
            soup = BeautifulSoup(response.text, 'html.parser')
            contenedor_dolar = soup.find('div', {'id': 'dolar'})
            valor_dolar = contenedor_dolar.find('strong').text.strip()
            rate = float(valor_dolar.replace(',', '.'))
            
            CurrencyRate = self.env['res.currency.rate']
            currency = self.env.ref("base.USD")
            today = date.today().strftime('%Y-%m-%d')
            
            companies = self.env['res.company'].search([])  # Reemplaza 'your.company.model' por el modelo de tu empresa
            
            for company in companies:
                company_model = self.env[company._name]
                existing_rate = CurrencyRate.search([('currency_id', '=', currency.id), ('name', '=', today), ('company_id', '=', company.id)])
                
                if existing_rate:
                    existing_rate.write({'inverse_company_rate': rate})
                else:
                    CurrencyRate.create({'currency_id': currency.id, 'name': today, 'inverse_company_rate': rate, 'company_id': company.id})

            # Update pricelists
            product_ids = self.env['product.product'].sudo().search([], limit=100)
            for product in product_ids:
                new_price = product.dollar_price * rate
                product.write({'list_price': new_price})
