# Generated manually for multi-participant support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_forumtopic_forumreply'),
    ]

    operations = [
        migrations.AddField(
            model_name='offer',
            name='max_participants',
            field=models.PositiveIntegerField(default=1, help_text='Maximum number of participants (Offers only)'),
        ),
    ]

