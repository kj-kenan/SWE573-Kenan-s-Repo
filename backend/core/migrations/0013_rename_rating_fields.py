# Generated manually to fix field name mismatches

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_offer_max_participants'),
    ]

    operations = [
        migrations.RenameField(
            model_name='rating',
            old_name='rated_user',
            new_name='ratee',
        ),
        migrations.RenameField(
            model_name='rating',
            old_name='rating',
            new_name='score',
        ),
    ]

