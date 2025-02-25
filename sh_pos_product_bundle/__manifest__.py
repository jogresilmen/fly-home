# Part of Softhealer Technologies.
{
    "name": "POS Product Bundle",
    "author": "Softhealer Technologies",
    "website": "https://www.softhealer.com",
    "support": "support@softhealer.com",
    "category": "Extra Tools",
    "license": "OPL-1",
    "summary": "Point Of Sale Bunch Products, POS Product Package, Product Combo Module, Particular Product Bundle, Product Pack Point Of Sale, Mass Products In POS, Multiple Products Point Of Sale,Point Of Sale Products In Pack, Make POS Product Bunch Odoo Point of Sale Product Bundle pack Combined Product Pack Bundle Pack POS Product Bundle Pack POS Product Kit POS Combo Pack Point of Sale Product Pack",
    "description": """ Do you want to make a combo of several products? This module is useful to make a pack of products in the point of sale. You can generate a product bundle for selling multi-products at once. You can make a bunch of several products easily. cheers! Point Of Sale Product Bundle Odoo, Point Of Sale Product Combo Odoo Bunch Products On Point Of Sale Module, Point Of Sale Products, Generate Product Package, Manage Product Combo, Fix Particular Product Bundle,Give Product Pack, Mass Products On POS, Add Multiple Products, POS Product Management Odoo. Point Of Sale Bunch Products, POS Products App, Point Of Sale Product Package, Product Combo Module, Particular Product Bundle, Product Pack Point Of Sale, Mass Products In POS, Multiple Products Point Of Sale,Point Of Sale Products In Pack, Make POS Product Bunch Odoo.""",
    "version": "0.0.1",
    "depends": ["point_of_sale", "sh_base_bundle",'product'],
    "application": True,
    "data": ["views/views.xml","views/selct.xml"],
    'assets': {
        'point_of_sale._assets_pos': [
            'web/static/lib/select2/select2.css',
            'web/static/lib/select2-bootstrap-css/select2-bootstrap.css',
            'web/static/lib/select2/select2.js',
            'sh_pos_product_bundle/static/src/js/*',
            
            'sh_pos_product_bundle/static/src/overrides/**/*',
            'sh_pos_product_bundle/static/src/models/popups/**/*',
            'sh_pos_product_bundle/static/src/scss/pos.scss',
        ]
    },
    "auto_install": False,
    "installable": True,
    "price": 60,
    "currency": "EUR",
    "images": ['static/description/background.png', ],
    "live_test_url": "https://youtu.be/gadJJMkSHfU",
}
