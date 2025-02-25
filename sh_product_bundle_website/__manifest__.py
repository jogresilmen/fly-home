# -*- coding: utf-8 -*-
# Part of Softhealer Technologies.
{
    'name': 'Bundle Product Management-Website',
    'author': 'Softhealer Technologies',
    'website': "https://www.softhealer.com",
    "support": "support@softhealer.com",
    'version': '0.0.1',
    'category': 'Website',
    "license": "OPL-1",
    'summary': "Website Bunch Products,Website Product Package, Product Combo Module, Product Pack On Shop app, Mass Products On Shop, Multiple Products On Shop, Multiple Products In Pack, Make Product Bunch,Products Bunch,Products Pack,Products Bundle Odoo",
    "description": """Do you want to make a combo of several products on the website? In competitive market prices play an important role. This module is useful for creating a pack of some products on the shop page. You can generate a product bundle for selling multi-products at once. You can make a bunch of several products and easily enhance your sailing. If you change the price on the website then it automatically changes in backend.

 All In One Product Bundle Odoo, All In One Product Combo Odoo, All In One Product Pack Odoo.
 Bunch Products On Shop Module, All In One Products, Generate Product Package, Manage Product Combo, Fix Particular Product Bundle,Give Product Pack, Mass Products On Website, Add Multiple Products, Website Product Management Odoo. 
 Website Bunch Products, All In One Products App, Website Product Package, Product Combo Module, Particular Product Bundle, Product Pack On Shop, Mass Products On Shop, Multiple Products On Shop, Multiple Products In Pack, Make Product Bunch, All In One Products Combo, All In One Products Bunch, All In One Products Pack,All In One Products Bundle Odoo.""",

    'depends': ['sh_product_bundle', 'website_sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/sh_sale_order_view.xml',
        'views/sh_website_sale_template.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'sh_product_bundle_website/static/src/js/**/*',
        ]
    },
    "installable": True,
    "auto_install": False,
    "application": True,
    "images": ['static/description/background.png'],
    "price": 50,
    "currency": 'EUR',
}
