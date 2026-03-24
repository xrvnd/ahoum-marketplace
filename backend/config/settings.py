from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url


# PATHS
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['*']


# INSTALLED APPS

INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # Third-party
    'rest_framework',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',

    # Your apps
    'apps.accounts',
    'apps.marketplace_sessions',
    'apps.bookings',
]


# MIDDLEWARE

# CorsMiddleware 
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',  # allauth requires this
]


# URLS & WSGI
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'


# TEMPLATES
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# DATABASE

DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    # Docker / production — use DATABASE_URL
    DATABASES = {
        'default': dj_database_url.parse(str(DATABASE_URL), conn_max_age=600)
    }
else:
    # Local dev fallback — SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# AUTHENTICATION

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]



# ALLAUTH CONFIGURATION



# ALLAUTH (allauth 65.x format)
SITE_ID = 1
LOGIN_REDIRECT_URL = '/api/auth/callback/'

ACCOUNT_SIGNUP_FIELDS      = ['email*', 'password1*', 'password2*']
ACCOUNT_LOGIN_METHODS      = ['email']
ACCOUNT_EMAIL_VERIFICATION = 'none'

SOCIALACCOUNT_ADAPTER   = 'apps.accounts.adapters.CustomSocialAccountAdapter'
SOCIALACCOUNT_AUTO_SIGNUP    = True
SOCIALACCOUNT_EMAIL_REQUIRED = False
SOCIALACCOUNT_LOGIN_ON_GET   = True

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'OAUTH_PKCE_ENABLED': True,
    }
}


# DJANGO REST FRAMEWORK

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Public endpoints (catalog) are readable without auth
    # Protected endpoints (booking, dashboard) require JWT
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
}



# SIMPLE JWT

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}


# CORS
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',   # Next.js dev server
]
# Required so the frontend can send the JWT cookie/header cross-origin
CORS_ALLOW_CREDENTIALS = True



# PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# INTERNATIONALISATION

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True



# STATIC FILES

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# Tells Django to use BigAutoField for auto-generated primary keys
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'