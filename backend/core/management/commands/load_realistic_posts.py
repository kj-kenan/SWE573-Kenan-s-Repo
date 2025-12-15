import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Offer, Request
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Load 50+ realistic offers and requests around Hisarüstü and Göktürk areas'

    # Center coordinates
    HISARUSTU_CENTER = (41.165, 28.890)
    GOKTURK_CENTER = (41.180, 28.920)

    # Realistic offers (people needing help)
    OFFERS_DATA = [
        # Home & Garden
        ("Help needed with garden cleanup", "My garden needs cleaning before spring. Need help removing weeds, trimming bushes, and general tidying.", ["gardening", "physical", "outdoor"], 3, 2),
        ("Looking for someone to help move furniture", "Moving some heavy furniture to another room. Need strong helpers for about 2 hours.", ["physical", "moving", "indoor"], 2, 2),
        ("Need help painting my daughter's room", "Want to repaint my daughter's bedroom. All materials ready, just need helping hands.", ["physical", "home", "indoor"], 4, 2),
        ("Kitchen cabinet assembly needed", "Bought new IKEA cabinets, need help assembling them in my kitchen.", ["repair", "physical", "indoor"], 5, 1),
        ("Balcony garden setup help", "Want to create a small balcony garden. Need help with planning and setup.", ["gardening", "outdoor", "design"], 3, 1),
        ("Help organizing garage", "My garage is a mess and needs complete organization. Heavy lifting involved.", ["physical", "organization", "indoor"], 4, 2),
        ("Window cleaning - 2nd floor", "Need someone to help clean exterior windows on 2nd floor. Equipment provided.", ["cleaning", "physical", "outdoor"], 2, 1),
        ("Bookshelf assembly and arrangement", "Have 3 large bookshelves to assemble and arrange in study room.", ["physical", "indoor", "assembly"], 3, 1),
        ("Help with spring cleaning", "Deep cleaning needed for entire apartment. Looking for helping hands.", ["cleaning", "physical", "indoor"], 6, 2),
        ("Garden fence repair needed", "Wooden garden fence needs repair. Some panels need replacing.", ["repair", "physical", "outdoor"], 4, 1),
        
        # Children & Education
        ("Math tutor needed for high school", "My son needs help with calculus and algebra. Looking for patient tutor.", ["education", "tutoring", "math"], 2, 1),
        ("English conversation practice needed", "Want to improve my English speaking. Need conversation partner.", ["language", "education", "indoor"], 2, 1),
        ("After-school childcare help", "Need someone to pick up my kids from school and stay with them until 6 PM.", ["childcare", "transportation", "indoor"], 3, 1),
        ("Science project help for middle schooler", "My daughter needs help with her science fair project about plants.", ["education", "tutoring", "science"], 2, 1),
        ("Piano lessons for beginner", "Complete beginner looking to learn piano basics. Have a keyboard at home.", ["music", "education", "indoor"], 1, 1),
        ("Help with university application", "Need guidance filling out university applications and writing essays.", ["education", "writing", "guidance"], 3, 1),
        ("Turkish lessons for foreigner", "Recently moved to Turkey, need help learning Turkish language basics.", ["language", "education", "indoor"], 2, 1),
        ("Homework help for elementary student", "My 3rd grader needs general homework help after school.", ["education", "tutoring", "childcare"], 2, 1),
        
        # Technology & Digital
        ("Computer repair needed", "My laptop is very slow and has some issues. Need tech-savvy person to fix it.", ["technology", "repair", "indoor"], 2, 1),
        ("Help setting up smart home devices", "Bought smart bulbs and thermostat, need help installing and configuring.", ["technology", "installation", "indoor"], 2, 1),
        ("Website content updates needed", "Have a small business website, need help updating some pages and photos.", ["technology", "design", "web"], 3, 1),
        ("Social media guidance for business", "Small business owner needing help understanding Instagram and Facebook.", ["technology", "social", "marketing"], 2, 1),
        ("Phone data transfer help", "Got a new phone, need help transferring all data from old one.", ["technology", "mobile", "indoor"], 1, 1),
        ("Excel spreadsheet organization", "Have lots of business data that needs to be organized in Excel properly.", ["technology", "organization", "data"], 3, 1),
        ("WiFi network setup help", "Need help setting up a new WiFi router and extending coverage in house.", ["technology", "installation", "indoor"], 2, 1),
        
        # Pets & Animals
        ("Dog walking while on vacation", "Going on vacation for 5 days, need someone to walk my dog twice daily.", ["pets", "outdoor", "walking"], 1, 1),
        ("Cat feeding during work hours", "Working long hours this week, need someone to visit and feed my cat.", ["pets", "indoor", "care"], 1, 1),
        ("Help bathing large dog", "My golden retriever needs a bath but he's too big for me to handle alone.", ["pets", "physical", "outdoor"], 2, 1),
        ("Aquarium cleaning help", "Large aquarium needs cleaning and maintenance. Some experience preferred.", ["pets", "indoor", "maintenance"], 2, 1),
        
        # Elderly Care & Health
        ("Companion for elderly mother", "My mother lives alone and would appreciate someone to chat with and keep company.", ["eldercare", "social", "companion"], 3, 1),
        ("Grocery shopping for elderly neighbor", "Elderly neighbor needs help with weekly grocery shopping.", ["shopping", "eldercare", "assistance"], 2, 1),
        ("Medical appointment accompaniment", "Need someone to accompany my father to his doctor's appointment.", ["eldercare", "transportation", "health"], 3, 1),
        ("Reading companion for visually impaired", "My grandmother loves books but can't read anymore. Looking for someone to read to her.", ["eldercare", "social", "reading"], 2, 1),
        
        # Transportation & Errands
        ("Airport pickup needed", "Need a ride from Sabiha Gökçen Airport to Hisarüstü next Tuesday.", ["transportation", "driving", "travel"], 2, 1),
        ("Furniture pickup from store", "Bought furniture from store in Maslak, need help transporting to my home.", ["transportation", "moving", "physical"], 2, 2),
        ("Shopping trip to wholesale market", "Going to wholesale market, need someone with a car to help transport items.", ["shopping", "transportation", "physical"], 4, 1),
        ("Multiple errand assistance", "Have several errands to run (bank, post office, market). Need helping companion.", ["errands", "transportation", "shopping"], 3, 1),
    ]

    # Realistic requests (people offering help)
    REQUESTS_DATA = [
        # Skills & Teaching
        ("Can teach guitar - beginner to intermediate", "Professional guitarist offering lessons. Have 10 years experience teaching.", ["music", "education", "teaching"], 2, 3),
        ("Offering web development help", "Full-stack developer can help build or fix websites for small businesses.", ["technology", "web", "development"], 4, 2),
        ("Graphic design for social media", "Can create social media graphics, logos, and simple designs for your business.", ["design", "arts", "technology"], 3, 3),
        ("Mathematics tutoring - all levels", "Math teacher offering free tutoring sessions for students of all ages.", ["education", "tutoring", "math"], 2, 4),
        ("Photography for events", "Amateur photographer offering to photograph birthday parties, gatherings, etc.", ["photography", "arts", "events"], 3, 3),
        ("Turkish language lessons", "Native speaker offering Turkish lessons for foreigners. Patient and experienced.", ["language", "education", "teaching"], 2, 4),
        ("Yoga classes for beginners", "Certified yoga instructor offering beginner-friendly sessions in your home.", ["health", "sports", "wellness"], 2, 5),
        ("Piano lessons - classical and pop", "Conservatory graduate offering piano lessons for all ages and levels.", ["music", "education", "teaching"], 2, 3),
        ("English conversation practice", "Native English speaker available for conversation practice and accent training.", ["language", "education", "conversation"], 2, 4),
        ("Cooking classes - Turkish cuisine", "Can teach traditional Turkish cooking. Will bring ingredients and recipes.", ["cooking", "education", "culture"], 3, 3),
        ("Digital marketing consultation", "Marketing professional offering guidance on social media and online presence.", ["technology", "marketing", "business"], 2, 3),
        ("Resume writing and career coaching", "HR professional offering help with resumes and interview preparation.", ["education", "career", "writing"], 2, 4),
        ("Knitting and crochet lessons", "Can teach knitting and crochet basics. Bring your own materials.", ["crafts", "arts", "teaching"], 2, 3),
        ("Video editing for content creators", "Can edit videos for YouTube, Instagram, or personal projects.", ["technology", "arts", "editing"], 3, 3),
        
        # Home & Repair Services
        ("Furniture assembly service", "Experienced with IKEA and all furniture assembly. Have all necessary tools.", ["repair", "physical", "assembly"], 3, 4),
        ("Basic electrical repairs", "Licensed electrician offering help with simple electrical issues and installations.", ["repair", "electrical", "technical"], 2, 3),
        ("Bicycle repair and maintenance", "Bike mechanic offering repair services. Can fix most common issues.", ["repair", "sports", "mechanical"], 2, 4),
        ("Basic plumbing help", "Can help with simple plumbing issues like leaky faucets, toilet repairs.", ["repair", "plumbing", "technical"], 2, 3),
        ("Painting and wall repairs", "Experienced painter available for room painting and minor wall repairs.", ["physical", "painting", "home"], 4, 2),
        ("Garden design consultation", "Landscape architect offering garden planning and design advice.", ["gardening", "design", "outdoor"], 2, 3),
        ("Appliance repair consultation", "Can diagnose and fix common household appliance problems.", ["repair", "technical", "appliances"], 2, 3),
        ("Carpentry and woodworking", "Skilled carpenter available for furniture repair and small woodworking projects.", ["repair", "carpentry", "crafts"], 3, 2),
        
        # Technology & Digital Help
        ("Computer troubleshooting", "IT professional offering help with computer issues, virus removal, setup.", ["technology", "repair", "IT"], 2, 4),
        ("Smartphone setup and training", "Can help elderly people learn to use smartphones and apps.", ["technology", "education", "mobile"], 2, 3),
        ("Website creation for small business", "Can create simple WordPress websites for small businesses and shops.", ["technology", "web", "business"], 5, 2),
        ("Social media management help", "Can help set up and manage social media accounts for personal or business use.", ["technology", "social", "marketing"], 2, 4),
        ("Photo editing and retouching", "Professional photo editor offering editing services for personal photos.", ["technology", "arts", "photography"], 2, 4),
        ("Data recovery assistance", "Can help recover lost data from computers and external drives.", ["technology", "IT", "recovery"], 3, 2),
        
        # Care & Assistance
        ("Dog walking and pet sitting", "Animal lover offering dog walking and pet sitting services in the area.", ["pets", "outdoor", "care"], 1, 5),
        ("Elderly companion services", "Patient and caring person offering companionship for elderly people.", ["eldercare", "social", "care"], 3, 2),
        ("Shopping assistance", "Can help with grocery shopping and carrying heavy bags for elderly or busy people.", ["shopping", "assistance", "physical"], 2, 4),
        ("Meal preparation service", "Can prepare healthy meals in your home. Vegetarian and vegan options available.", ["cooking", "health", "nutrition"], 3, 3),
        ("Child homework assistance", "Elementary school teacher offering after-school homework help.", ["childcare", "education", "tutoring"], 2, 3),
        ("House cleaning help", "Experienced cleaner available for regular or one-time deep cleaning.", ["cleaning", "physical", "home"], 4, 3),
        
        # Transportation & Moving
        ("Moving help with van", "Have a van and can help with moving furniture or transporting large items.", ["moving", "transportation", "physical"], 4, 2),
        ("Airport transportation", "Can provide rides to/from airports. Reliable and punctual service.", ["transportation", "driving", "travel"], 2, 3),
        ("Delivery service in neighborhood", "Can help deliver items within Hisarüstü and Göktürk area. Have a car.", ["transportation", "delivery", "service"], 2, 4),
        
        # Sports & Fitness
        ("Personal training sessions", "Certified personal trainer offering home workout sessions.", ["sports", "health", "fitness"], 2, 4),
        ("Tennis lessons for beginners", "Tennis coach offering lessons for kids and adults.", ["sports", "education", "outdoor"], 2, 3),
        ("Running buddy available", "Marathon runner looking for running partners in the area. All paces welcome.", ["sports", "outdoor", "fitness"], 1, 5),
        ("Swimming lessons for children", "Swimming instructor offering lessons for kids at local pool.", ["sports", "education", "children"], 1, 4),
    ]

    def add_random_offset(self, center, max_offset=0.015):
        """Add random offset to coordinates (roughly 1-2km radius)"""
        lat_offset = random.uniform(-max_offset, max_offset)
        lng_offset = random.uniform(-max_offset, max_offset)
        return (center[0] + lat_offset, center[1] + lng_offset)

    def handle(self, *args, **kwargs):
        # Get all verified users
        users = list(User.objects.filter(profile__email_verified=True))
        
        if not users:
            self.stdout.write(self.style.ERROR('No verified users found. Please create users first.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Found {len(users)} verified users'))

        created_offers = 0
        created_requests = 0

        # Create offers
        self.stdout.write(self.style.NOTICE('Creating realistic offers...'))
        for title, description, tags, duration, slots in self.OFFERS_DATA:
            # Randomly choose between two areas
            center = random.choice([self.HISARUSTU_CENTER, self.GOKTURK_CENTER])
            latitude, longitude = self.add_random_offset(center)
            
            user = random.choice(users)
            
            # Convert tags list to comma-separated string
            tags_str = ','.join(tags) if isinstance(tags, list) else tags
            
            # Duration is a CharField, format as "X hours"
            duration_str = f"{duration} hours"
            
            offer = Offer.objects.create(
                user=user,
                title=title,
                description=description,
                tags=tags_str,
                latitude=latitude,
                longitude=longitude,
                duration=duration_str,
                max_participants=slots,
                created_at=datetime.now() - timedelta(days=random.randint(1, 30))
            )
            created_offers += 1

        # Create requests
        self.stdout.write(self.style.NOTICE('Creating realistic requests...'))
        for title, description, tags, duration, slots in self.REQUESTS_DATA:
            # Randomly choose between two areas
            center = random.choice([self.HISARUSTU_CENTER, self.GOKTURK_CENTER])
            latitude, longitude = self.add_random_offset(center)
            
            user = random.choice(users)
            
            # Convert tags list to comma-separated string
            tags_str = ','.join(tags) if isinstance(tags, list) else tags
            
            # Duration is a CharField, format as "X hours"
            duration_str = f"{duration} hours"
            
            request = Request.objects.create(
                user=user,
                title=title,
                description=description,
                tags=tags_str,
                latitude=latitude,
                longitude=longitude,
                duration=duration_str,
                created_at=datetime.now() - timedelta(days=random.randint(1, 30))
            )
            created_requests += 1

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Successfully created:\n'
            f'   • {created_offers} offers\n'
            f'   • {created_requests} requests\n'
            f'   • Total: {created_offers + created_requests} posts\n'
            f'\nAll posts are distributed around Hisarüstü and Göktürk areas.'
        ))

