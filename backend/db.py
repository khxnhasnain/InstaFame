import os
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from pathlib import Path

try:
    import pymysql
    import pymysql.cursors
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False

# MySQL Configuration from Environment (default to XAMPP)
MYSQL_HOST = os.environ.get("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", 3306))
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "instafame_db")

FALLBACK_STORE_FILE = Path(__file__).resolve().parent / "fallback_db.json"

DEFAULT_RATES = {
    "id": "global_rates",
    "rate_per_1000_followers": 80.00,
    "rate_per_1000_likes": 40.00,
    "rate_per_1000_views": 20.00,
    "currency": "INR"
}

def generate_default_packages(rate_followers: float = 80.00, rate_likes: float = 40.00, rate_views: float = 20.00) -> List[Dict[str, Any]]:
    return [
        # Followers Packages: 1k, 10k, 100k, 1M
        {
            "id": "pkg_followers_1k",
            "service_type": "followers",
            "amount": 1000,
            "label": "1K Followers",
            "price": round((1000 / 1000.0) * rate_followers, 2),
            "currency": "INR",
            "popular": False,
            "tag": "Starter Growth",
            "is_active": True
        },
        {
            "id": "pkg_followers_10k",
            "service_type": "followers",
            "amount": 10000,
            "label": "10K Followers",
            "price": round((10000 / 1000.0) * rate_followers * 0.95, 2), # 5% discount
            "currency": "INR",
            "popular": True,
            "tag": "Most Popular",
            "is_active": True
        },
        {
            "id": "pkg_followers_100k",
            "service_type": "followers",
            "amount": 100000,
            "label": "100K Followers",
            "price": round((100000 / 1000.0) * rate_followers * 0.90, 2), # 10% discount
            "currency": "INR",
            "popular": False,
            "tag": "Pro Creator",
            "is_active": True
        },
        {
            "id": "pkg_followers_1m",
            "service_type": "followers",
            "amount": 1000000,
            "label": "1M Followers",
            "price": round((1000000 / 1000.0) * rate_followers * 0.80, 2), # 20% discount
            "currency": "INR",
            "popular": False,
            "tag": "Celebrity Fame",
            "is_active": True
        },

        # Likes Packages: 1k, 10k, 100k, 1M
        {
            "id": "pkg_likes_1k",
            "service_type": "likes",
            "amount": 1000,
            "label": "1K Likes",
            "price": round((1000 / 1000.0) * rate_likes, 2),
            "currency": "INR",
            "popular": False,
            "tag": "Starter Boost",
            "is_active": True
        },
        {
            "id": "pkg_likes_10k",
            "service_type": "likes",
            "amount": 10000,
            "label": "10K Likes",
            "price": round((10000 / 1000.0) * rate_likes * 0.95, 2), # 5% discount
            "currency": "INR",
            "popular": True,
            "tag": "Most Popular",
            "is_active": True
        },
        {
            "id": "pkg_likes_100k",
            "service_type": "likes",
            "amount": 100000,
            "label": "100K Likes",
            "price": round((100000 / 1000.0) * rate_likes * 0.90, 2), # 10% discount
            "currency": "INR",
            "popular": False,
            "tag": "Viral Hit",
            "is_active": True
        },
        {
            "id": "pkg_likes_1m",
            "service_type": "likes",
            "amount": 1000000,
            "label": "1M Likes",
            "price": round((1000000 / 1000.0) * rate_likes * 0.80, 2), # 20% discount
            "currency": "INR",
            "popular": False,
            "tag": "Explore Sensation",
            "is_active": True
        },

        # Reel Views Packages: 1k, 10k, 100k, 1M
        {
            "id": "pkg_views_1k",
            "service_type": "views",
            "amount": 1000,
            "label": "1K Reel Views",
            "price": round((1000 / 1000.0) * rate_views, 2),
            "currency": "INR",
            "popular": False,
            "tag": "Starter Views",
            "is_active": True
        },
        {
            "id": "pkg_views_10k",
            "service_type": "views",
            "amount": 10000,
            "label": "10K Reel Views",
            "price": round((10000 / 1000.0) * rate_views * 0.95, 2), # 5% discount
            "currency": "INR",
            "popular": True,
            "tag": "Most Popular",
            "is_active": True
        },
        {
            "id": "pkg_views_100k",
            "service_type": "views",
            "amount": 100000,
            "label": "100K Reel Views",
            "price": round((100000 / 1000.0) * rate_views * 0.90, 2), # 10% discount
            "currency": "INR",
            "popular": False,
            "tag": "Viral Reel",
            "is_active": True
        },
        {
            "id": "pkg_views_1m",
            "service_type": "views",
            "amount": 1000000,
            "label": "1M Reel Views",
            "price": round((1000000 / 1000.0) * rate_views * 0.80, 2), # 20% discount
            "currency": "INR",
            "popular": False,
            "tag": "Explore Sensation",
            "is_active": True
        },
    ]

def load_fallback_store() -> Dict[str, Any]:
    if FALLBACK_STORE_FILE.exists():
        try:
            with open(FALLBACK_STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    store = {
        "rates": DEFAULT_RATES,
        "packages": generate_default_packages(),
        "users": [],
        "orders": [],
        "transactions": []
    }
    save_fallback_store(store)
    return store

def save_fallback_store(store: Dict[str, Any]):
    try:
        with open(FALLBACK_STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=2, default=str)
    except Exception as e:
        print(f"Fallback DB save notice: {e}")

class DatabaseManager:
    def __init__(self):
        self._is_mysql_connected = False
        self._last_check_time = 0

    def get_connection(self):
        if not PYMYSQL_AVAILABLE:
            return None
        try:
            # Connect and ensure DB exists
            server_conn = pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=3
            )
            with server_conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            server_conn.close()

            conn = pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=3,
                autocommit=True
            )
            return conn
        except Exception as e:
            return None

    def init_tables(self):
        conn = self.get_connection()
        if not conn:
            self._is_mysql_connected = False
            return False

        try:
            with conn.cursor() as cursor:
                # 1. Master Rates Table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `pricing_settings` (
                    `id` VARCHAR(32) PRIMARY KEY DEFAULT 'global_rates',
                    `rate_per_1000_followers` DECIMAL(10, 2) NOT NULL DEFAULT 80.00,
                    `rate_per_1000_likes` DECIMAL(10, 2) NOT NULL DEFAULT 40.00,
                    `rate_per_1000_views` DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
                    `currency` VARCHAR(16) DEFAULT 'INR',
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                try:
                    cursor.execute("ALTER TABLE `pricing_settings` ADD COLUMN `rate_per_1000_views` DECIMAL(10, 2) NOT NULL DEFAULT 20.00;")
                except Exception:
                    pass

                # 2. Packages table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `packages` (
                    `id` VARCHAR(64) PRIMARY KEY,
                    `service_type` VARCHAR(32) NOT NULL,
                    `amount` INT NOT NULL,
                    `label` VARCHAR(128) NOT NULL,
                    `price` DECIMAL(10, 2) NOT NULL,
                    `currency` VARCHAR(16) DEFAULT 'INR',
                    `popular` BOOLEAN DEFAULT FALSE,
                    `tag` VARCHAR(64) DEFAULT '',
                    `is_active` BOOLEAN DEFAULT TRUE,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # 3. Users table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `users` (
                    `id` VARCHAR(128) PRIMARY KEY,
                    `email` VARCHAR(255) UNIQUE NOT NULL,
                    `name` VARCHAR(255) DEFAULT '',
                    `avatar_url` TEXT,
                    `provider` VARCHAR(64) DEFAULT 'google',
                    `role` VARCHAR(32) DEFAULT 'user',
                    `total_orders_count` INT DEFAULT 0,
                    `wallet_balance` DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
                    `last_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                try:
                    cursor.execute("ALTER TABLE `users` ADD COLUMN `wallet_balance` DECIMAL(10, 2) NOT NULL DEFAULT 50.00;")
                except Exception:
                    pass


                # 4. Growth Orders table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `growth_orders` (
                    `id` VARCHAR(64) PRIMARY KEY,
                    `smm_order_id` VARCHAR(64) DEFAULT NULL,
                    `user_email` VARCHAR(255) NOT NULL,
                    `service_type` VARCHAR(32) NOT NULL,
                    `target_username` VARCHAR(128) NOT NULL,
                    `target_post_url` TEXT,
                    `package_amount` INT NOT NULL,
                    `package_label` VARCHAR(128) NOT NULL,
                    `price` DECIMAL(10, 2) NOT NULL,
                    `initial_count` INT DEFAULT 0,
                    `approx_after_count` INT DEFAULT 0,
                    `current_count` INT DEFAULT 0,
                    `remains` INT DEFAULT 0,
                    `status` VARCHAR(32) DEFAULT 'ordered',
                    `smm_status` VARCHAR(64) DEFAULT NULL,
                    `last_checked_at` TIMESTAMP NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # Safely ensure new columns exist in existing MySQL databases
                for col_def in [
                    "ALTER TABLE `growth_orders` ADD COLUMN `smm_order_id` VARCHAR(64) DEFAULT NULL;",
                    "ALTER TABLE `growth_orders` ADD COLUMN `remains` INT DEFAULT 0;",
                    "ALTER TABLE `growth_orders` ADD COLUMN `smm_status` VARCHAR(64) DEFAULT NULL;",
                    "ALTER TABLE `growth_orders` ADD COLUMN `last_checked_at` TIMESTAMP NULL;"
                ]:
                    try:
                        cursor.execute(col_def)
                    except Exception:
                        pass


                # 5. Wallet Transactions History table (Credits & Debits)
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `wallet_transactions` (
                    `id` VARCHAR(64) PRIMARY KEY,
                    `user_email` VARCHAR(255) NOT NULL,
                    `type` VARCHAR(32) NOT NULL,
                    `amount` DECIMAL(10, 2) NOT NULL,
                    `balance_after` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                    `service_type` VARCHAR(64) DEFAULT 'wallet_topup',
                    `description` VARCHAR(255) NOT NULL,
                    `reference_id` VARCHAR(64) DEFAULT '',
                    `status` VARCHAR(32) DEFAULT 'successful',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # Fetch current rate
                cursor.execute("SELECT * FROM `pricing_settings` WHERE `id` = 'global_rates';")
                current_rate = cursor.fetchone()
                rf = float(current_rate["rate_per_1000_followers"]) if current_rate and "rate_per_1000_followers" in current_rate else 80.00
                rl = float(current_rate["rate_per_1000_likes"]) if current_rate and "rate_per_1000_likes" in current_rate else 40.00
                rv = float(current_rate["rate_per_1000_views"]) if current_rate and "rate_per_1000_views" in current_rate else 20.00

                if not current_rate:
                    cursor.execute("""
                    INSERT INTO `pricing_settings` (`id`, `rate_per_1000_followers`, `rate_per_1000_likes`, `rate_per_1000_views`, `currency`)
                    VALUES ('global_rates', %s, %s, %s, 'INR');
                    """, (rf, rl, rv))

                # Seed initial packages only if not already present (do not overwrite admin custom price)
                for pkg in generate_default_packages(rf, rl, rv):
                    cursor.execute("""
                    INSERT INTO `packages` (`id`, `service_type`, `amount`, `label`, `price`, `currency`, `popular`, `tag`, `is_active`)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        `amount` = VALUES(`amount`),
                        `label` = VALUES(`label`),
                        `currency` = VALUES(`currency`),
                        `popular` = VALUES(`popular`),
                        `tag` = VALUES(`tag`);
                    """, (
                        pkg["id"], pkg["service_type"], pkg["amount"], pkg["label"],
                        pkg["price"], pkg["currency"], pkg["popular"], pkg["tag"], pkg["is_active"]
                    ))

                # Delete legacy non-standard or duplicate packages
                cursor.execute("""
                DELETE FROM `packages` WHERE `id` NOT IN (
                    'pkg_followers_1k', 'pkg_followers_10k', 'pkg_followers_100k', 'pkg_followers_1m',
                    'pkg_likes_1k', 'pkg_likes_10k', 'pkg_likes_100k', 'pkg_likes_1m',
                    'pkg_views_1k', 'pkg_views_10k', 'pkg_views_100k', 'pkg_views_1m'
                );
                """)

            conn.close()
            self._is_mysql_connected = True
            return True
        except Exception as e:
            print(f"MySQL Table Init notice: {e}")
            if conn:
                conn.close()
            self._is_mysql_connected = False
            return False

    def is_connected(self) -> bool:
        now = time.time()
        if now - self._last_check_time > 5:
            self._last_check_time = now
            conn = self.get_connection()
            if conn:
                self._is_mysql_connected = True
                conn.close()
            else:
                self._is_mysql_connected = False
        return self._is_mysql_connected

    # --- Master Rates (Per 1,000 Followers, Likes & Views) ---
    def get_pricing_rates(self) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM `pricing_settings` WHERE `id` = 'global_rates';")
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        return {
                            "rate_per_1000_followers": float(row.get("rate_per_1000_followers", 80.0)),
                            "rate_per_1000_likes": float(row.get("rate_per_1000_likes", 40.0)),
                            "rate_per_1000_views": float(row.get("rate_per_1000_views", 20.0)),
                            "currency": row.get("currency", "INR")
                        }
            except Exception as e:
                print(f"MySQL get_pricing_rates notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        return store.get("rates", DEFAULT_RATES)

    def update_pricing_rates(self, rate_followers: float, rate_likes: float, rate_views: float = 20.00, auto_update_packages: bool = False) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    INSERT INTO `pricing_settings` (`id`, `rate_per_1000_followers`, `rate_per_1000_likes`, `rate_per_1000_views`, `currency`)
                    VALUES ('global_rates', %s, %s, %s, 'INR')
                    ON DUPLICATE KEY UPDATE
                        `rate_per_1000_followers` = VALUES(`rate_per_1000_followers`),
                        `rate_per_1000_likes` = VALUES(`rate_per_1000_likes`),
                        `rate_per_1000_views` = VALUES(`rate_per_1000_views`),
                        `currency` = 'INR',
                        `updated_at` = NOW();
                    """, (rate_followers, rate_likes, rate_views))

                    if auto_update_packages:
                        new_pkgs = generate_default_packages(rate_followers, rate_likes, rate_views)
                        for p in new_pkgs:
                            cursor.execute("""
                            INSERT INTO `packages` (`id`, `service_type`, `amount`, `label`, `price`, `currency`, `popular`, `tag`, `is_active`)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE
                                `price` = VALUES(`price`),
                                `amount` = VALUES(`amount`),
                                `label` = VALUES(`label`),
                                `currency` = VALUES(`currency`),
                                `tag` = VALUES(`tag`),
                                `popular` = VALUES(`popular`);
                            """, (
                                p["id"], p["service_type"], p["amount"], p["label"],
                                p["price"], p["currency"], p["popular"], p["tag"], p["is_active"]
                            ))

                conn.close()
                return {"rate_per_1000_followers": rate_followers, "rate_per_1000_likes": rate_likes, "rate_per_1000_views": rate_views, "currency": "INR"}
            except Exception as e:
                print(f"MySQL update_pricing_rates notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        store["rates"] = {"id": "global_rates", "rate_per_1000_followers": rate_followers, "rate_per_1000_likes": rate_likes, "rate_per_1000_views": rate_views, "currency": "INR"}
        if auto_update_packages:
            store["packages"] = generate_default_packages(rate_followers, rate_likes, rate_views)
        save_fallback_store(store)
        return store["rates"]

    # --- Packages / Dynamic Pricing Management ---
    def get_packages(self, service_type: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Clean up any legacy non-pkg packages
                    cursor.execute("""
                    DELETE FROM `packages` WHERE `id` NOT IN (
                        'pkg_followers_1k', 'pkg_followers_10k', 'pkg_followers_100k', 'pkg_followers_1m',
                        'pkg_likes_1k', 'pkg_likes_10k', 'pkg_likes_100k', 'pkg_likes_1m',
                        'pkg_views_1k', 'pkg_views_10k', 'pkg_views_100k', 'pkg_views_1m'
                    );
                    """)

                    if service_type:
                        cursor.execute("SELECT * FROM `packages` WHERE `service_type` = %s AND `is_active` = TRUE ORDER BY `amount` ASC;", (service_type,))
                    else:
                        cursor.execute("SELECT * FROM `packages` WHERE `is_active` = TRUE ORDER BY `service_type`, `amount` ASC;")
                    rows = cursor.fetchall()
                    for r in rows:
                        r["price"] = float(r["price"])
                        r["popular"] = bool(r["popular"])
                        r["is_active"] = bool(r["is_active"])
                    conn.close()
                    if rows:
                        return rows
            except Exception as e:
                print(f"MySQL get_packages notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        pkgs = store.get("packages")
        if not pkgs:
            rates = self.get_pricing_rates()
            rf = float(rates.get("rate_per_1000_followers", 80.0))
            rl = float(rates.get("rate_per_1000_likes", 40.0))
            rv = float(rates.get("rate_per_1000_views", 20.0))
            pkgs = generate_default_packages(rf, rl, rv)
            store["packages"] = pkgs
            save_fallback_store(store)
        if service_type:
            return [p for p in pkgs if p.get("service_type") == service_type]
        return pkgs


    def update_package(self, package_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    fields = []
                    values = []
                    for k in ["price", "amount", "label", "popular", "tag", "is_active", "currency"]:
                        if k in updates:
                            fields.append(f"`{k}` = %s")
                            values.append(updates[k])
                    if fields:
                        values.append(package_id)
                        query = f"UPDATE `packages` SET {', '.join(fields)} WHERE `id` = %s;"
                        cursor.execute(query, tuple(values))
                        cursor.execute("SELECT * FROM `packages` WHERE `id` = %s;", (package_id,))
                        row = cursor.fetchone()
                        if row:
                            row["price"] = float(row["price"])
                            row["popular"] = bool(row["popular"])
                            row["is_active"] = bool(row["is_active"])
                            conn.close()
                            return row
                conn.close()
            except Exception as e:
                print(f"MySQL update_package notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        for idx, p in enumerate(store.get("packages", [])):
            if p["id"] == package_id:
                store["packages"][idx].update(updates)
                save_fallback_store(store)
                return store["packages"][idx]
        return None

    # --- Wallet & Funds Management ---
    def get_user_wallet(self, email: str) -> float:
        clean_email = email.lower().strip()
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT `wallet_balance` FROM `users` WHERE `email` = %s;", (clean_email,))
                    row = cursor.fetchone()
                    conn.close()
                    if row and "wallet_balance" in row:
                        return float(row["wallet_balance"])
            except Exception as e:
                print(f"MySQL get_user_wallet notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        for u in store.get("users", []):
            if u.get("email") == clean_email:
                return float(u.get("wallet_balance", 50.00))
        return 50.00

    def add_wallet_balance(self, email: str, amount: float, description: str = "Wallet Top-Up / Recharge") -> Dict[str, Any]:
        clean_email = email.lower().strip()
        added_amount = max(0.0, float(amount))
        txn_id = f"TXN-{int(time.time() * 1000) % 10000000:07d}"
        created_at_str = datetime.now().isoformat()

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Ensure user row exists in MySQL
                    cursor.execute("""
                    INSERT INTO `users` (`id`, `email`, `name`, `wallet_balance`, `provider`, `role`)
                    VALUES (%s, %s, %s, 50.00, 'google', 'user')
                    ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
                    """, (f"usr_{clean_email.replace('@', '_').replace('.', '_')}", clean_email, clean_email.split('@')[0]))

                    cursor.execute("UPDATE `users` SET `wallet_balance` = `wallet_balance` + %s WHERE `email` = %s;", (added_amount, clean_email))
                    cursor.execute("SELECT `wallet_balance` FROM `users` WHERE `email` = %s;", (clean_email,))
                    row = cursor.fetchone()
                    new_bal = float(row["wallet_balance"]) if row else (50.00 + added_amount)

                    # Insert into wallet_transactions
                    cursor.execute("""
                    INSERT INTO `wallet_transactions` (
                        `id`, `user_email`, `type`, `amount`, `balance_after`,
                        `service_type`, `description`, `reference_id`, `status`
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        txn_id, clean_email, "credit", added_amount, new_bal,
                        "wallet_topup", description, txn_id, "successful"
                    ))
                    conn.close()
                    return {
                        "id": txn_id,
                        "email": clean_email,
                        "wallet_balance": new_bal,
                        "added_amount": added_amount,
                        "type": "credit",
                        "description": description,
                        "created_at": created_at_str
                    }
            except Exception as e:
                print(f"MySQL add_wallet_balance notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        current_balance = 50.00
        found = False
        for u in store.get("users", []):
            if u.get("email") == clean_email:
                u["wallet_balance"] = round(float(u.get("wallet_balance", 50.00)) + added_amount, 2)
                current_balance = u["wallet_balance"]
                found = True
                break
        if not found:
            user_obj = {
                "id": f"usr_{int(time.time())}",
                "email": clean_email,
                "name": clean_email.split("@")[0],
                "avatar_url": "",
                "provider": "google",
                "role": "user",
                "total_orders_count": 0,
                "wallet_balance": round(50.00 + added_amount, 2),
                "created_at": created_at_str,
                "last_login": created_at_str
            }
            store["users"].append(user_obj)
            current_balance = user_obj["wallet_balance"]

        # Record in fallback transactions
        txns = store.setdefault("transactions", [])
        txn_obj = {
            "id": txn_id,
            "user_email": clean_email,
            "type": "credit",
            "amount": added_amount,
            "balance_after": current_balance,
            "service_type": "wallet_topup",
            "description": description,
            "reference_id": txn_id,
            "status": "successful",
            "created_at": created_at_str
        }
        txns.insert(0, txn_obj)
        save_fallback_store(store)
        return {
            "id": txn_id,
            "email": clean_email,
            "wallet_balance": current_balance,
            "added_amount": added_amount,
            "type": "credit",
            "description": description,
            "created_at": created_at_str
        }

    def deduct_wallet_balance(self, email: str, amount: float) -> Tuple[bool, float, str]:
        clean_email = email.lower().strip()
        deduct_amount = max(0.0, float(amount))

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Ensure user row exists in MySQL
                    cursor.execute("""
                    INSERT INTO `users` (`id`, `email`, `name`, `wallet_balance`, `provider`, `role`)
                    VALUES (%s, %s, %s, 50.00, 'google', 'user')
                    ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
                    """, (f"usr_{clean_email.replace('@', '_').replace('.', '_')}", clean_email, clean_email.split('@')[0]))

                    cursor.execute("SELECT `wallet_balance` FROM `users` WHERE `email` = %s;", (clean_email,))
                    row = cursor.fetchone()
                    current_balance = float(row["wallet_balance"]) if row else 50.00

                    if current_balance < deduct_amount:
                        conn.close()
                        return False, current_balance, f"Insufficient wallet balance (₹{current_balance:.2f}). Required: ₹{deduct_amount:.2f}."

                    cursor.execute("UPDATE `users` SET `wallet_balance` = `wallet_balance` - %s WHERE `email` = %s;", (deduct_amount, clean_email))
                    cursor.execute("SELECT `wallet_balance` FROM `users` WHERE `email` = %s;", (clean_email,))
                    row_after = cursor.fetchone()
                    conn.close()
                    new_bal = float(row_after["wallet_balance"]) if row_after else (current_balance - deduct_amount)
                    return True, new_bal, "Wallet balance deducted successfully."
            except Exception as e:
                print(f"MySQL deduct_wallet_balance notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        current_balance = self.get_user_wallet(clean_email)
        if current_balance < deduct_amount:
            return False, current_balance, f"Insufficient wallet balance (₹{current_balance:.2f}). Required: ₹{deduct_amount:.2f}."

        new_bal = current_balance - deduct_amount
        for u in store.get("users", []):
            if u.get("email") == clean_email:
                u["wallet_balance"] = round(new_bal, 2)
                break
        save_fallback_store(store)
        return True, new_bal, "Wallet balance deducted successfully."

    # --- Login Users Management ---
    def sync_login_user(self, user_id: str, email: str, name: str, avatar_url: str = "", provider: str = "google", role: str = "user") -> Dict[str, Any]:
        clean_email = email.lower().strip()
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    INSERT INTO `users` (`id`, `email`, `name`, `avatar_url`, `provider`, `role`, `wallet_balance`, `last_login`)
                    VALUES (%s, %s, %s, %s, %s, %s, 50.00, NOW())
                    ON DUPLICATE KEY UPDATE
                        `name` = VALUES(`name`),
                        `avatar_url` = VALUES(`avatar_url`),
                        `role` = VALUES(`role`),
                        `last_login` = NOW();
                    """, (user_id or clean_email, clean_email, name or clean_email.split("@")[0], avatar_url, provider, role))
                    cursor.execute("SELECT * FROM `users` WHERE `email` = %s;", (clean_email,))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        row["wallet_balance"] = float(row.get("wallet_balance", 50.00))
                        return row
            except Exception as e:
                print(f"MySQL sync_login_user notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        users = store.get("users", [])
        found = False
        user_obj = None
        for u in users:
            if u.get("email") == clean_email:
                u["name"] = name or u.get("name")
                u["avatar_url"] = avatar_url or u.get("avatar_url")
                u["role"] = role
                u["last_login"] = datetime.now().isoformat()
                if "wallet_balance" not in u:
                    u["wallet_balance"] = 50.00
                user_obj = u
                found = True
                break
        if not found:
            user_obj = {
                "id": user_id or f"usr_{int(time.time())}",
                "email": clean_email,
                "name": name or clean_email.split("@")[0],
                "avatar_url": avatar_url,
                "provider": provider,
                "role": role,
                "total_orders_count": 0,
                "wallet_balance": 50.00,
                "created_at": datetime.now().isoformat(),
                "last_login": datetime.now().isoformat()
            }
            users.append(user_obj)
        store["users"] = users
        save_fallback_store(store)
        return user_obj

    def get_users(self) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM `users` ORDER BY `last_login` DESC;")
                    rows = cursor.fetchall()
                    for r in rows:
                        r["wallet_balance"] = float(r.get("wallet_balance", 50.00))
                    conn.close()
                    return rows
            except Exception as e:
                print(f"MySQL get_users notice: {e}")
                if conn:
                    conn.close()
        store = load_fallback_store()
        for u in store.get("users", []):
            if "wallet_balance" not in u:
                u["wallet_balance"] = 50.00
        return store.get("users", [])

    # --- Growth Orders (Followers & Likes Boost Records) ---
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        order_id = order_data.get("id") or f"ORD-{int(time.time() * 1000) % 1000000:06d}"
        smm_order_id = str(order_data.get("smm_order_id") or order_data.get("smmOrderId") or "").strip() or None
        user_email = (order_data.get("user_email") or "guest@instafame.com").lower().strip()
        service_type = order_data.get("service_type") or "followers"
        target_username = order_data.get("target_username") or ""
        target_post_url = order_data.get("target_post_url") or ""
        package_amount = int(order_data.get("package_amount") or 0)
        package_label = order_data.get("package_label") or f"+{package_amount}"
        price = float(order_data.get("price") or 0.0)
        initial_count = int(order_data.get("initial_count") or 0)
        approx_after_count = int(order_data.get("approx_after_count") or (initial_count + package_amount))
        current_count = int(order_data.get("current_count") or initial_count)
        remains = int(order_data.get("remains") or 0)
        status = order_data.get("status") or "ordered"
        smm_status = order_data.get("smm_status") or None

        # Check and deduct wallet balance
        success, remaining_balance, err_msg = self.deduct_wallet_balance(user_email, price)
        if not success:
            return {
                "success": False,
                "error": err_msg,
                "wallet_balance": remaining_balance,
                "required_amount": price
            }

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    INSERT INTO `growth_orders` (
                        `id`, `smm_order_id`, `user_email`, `service_type`, `target_username`, `target_post_url`,
                        `package_amount`, `package_label`, `price`, `initial_count`,
                        `approx_after_count`, `current_count`, `remains`, `status`, `smm_status`
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        order_id, smm_order_id, user_email, service_type, target_username, target_post_url,
                        package_amount, package_label, price, initial_count,
                        approx_after_count, current_count, remains, status, smm_status
                    ))
                    cursor.execute("UPDATE `users` SET `total_orders_count` = `total_orders_count` + 1 WHERE `email` = %s;", (user_email,))

                    # Insert corresponding debit transaction record into wallet_transactions
                    txn_id = f"TXN-{order_id}"
                    order_desc = f"{service_type.capitalize()} Boost ({package_label}) for @{target_username}"
                    cursor.execute("""
                    INSERT INTO `wallet_transactions` (
                        `id`, `user_email`, `type`, `amount`, `balance_after`,
                        `service_type`, `description`, `reference_id`, `status`
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        txn_id, user_email, "debit", price, remaining_balance,
                        service_type, order_desc, order_id, status
                    ))

                    cursor.execute("SELECT * FROM `growth_orders` WHERE `id` = %s;", (order_id,))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        row["price"] = float(row["price"])
                        row["success"] = True
                        row["remaining_wallet_balance"] = remaining_balance
                        return row
            except Exception as e:
                print(f"MySQL create_order notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        orders = store.get("orders", [])
        order_obj = {
            "id": order_id,
            "smm_order_id": smm_order_id,
            "user_email": user_email,
            "service_type": service_type,
            "target_username": target_username,
            "target_post_url": target_post_url,
            "package_amount": package_amount,
            "package_label": package_label,
            "price": price,
            "initial_count": initial_count,
            "approx_after_count": approx_after_count,
            "current_count": current_count,
            "remains": remains,
            "status": status,
            "smm_status": smm_status,
            "created_at": datetime.now().isoformat(),
            "success": True,
            "remaining_wallet_balance": remaining_balance
        }
        orders.insert(0, order_obj)
        store["orders"] = orders

        # Record in fallback transactions
        txns = store.setdefault("transactions", [])
        txn_id = f"TXN-{order_id}"
        order_desc = f"{service_type.capitalize()} Boost ({package_label}) for @{target_username}"
        txns.insert(0, {
            "id": txn_id,
            "user_email": user_email,
            "type": "debit",
            "amount": price,
            "balance_after": remaining_balance,
            "service_type": service_type,
            "description": order_desc,
            "reference_id": order_id,
            "status": status,
            "created_at": datetime.now().isoformat()
        })

        for u in store.get("users", []):
            if u.get("email") == user_email:
                u["total_orders_count"] = u.get("total_orders_count", 0) + 1
        save_fallback_store(store)
        return order_obj

    def update_order_status(self, order_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Ensure columns exist
                    for col in [
                        "ALTER TABLE `growth_orders` ADD COLUMN `smm_order_id` VARCHAR(64) DEFAULT NULL;",
                        "ALTER TABLE `growth_orders` ADD COLUMN `remains` INT DEFAULT 0;",
                        "ALTER TABLE `growth_orders` ADD COLUMN `smm_status` VARCHAR(64) DEFAULT NULL;",
                        "ALTER TABLE `growth_orders` ADD COLUMN `last_checked_at` TIMESTAMP NULL;"
                    ]:
                        try:
                            cursor.execute(col)
                        except Exception:
                            pass

                    fields = []
                    values = []
                    for k in ["status", "current_count", "initial_count", "remains", "smm_status", "smm_order_id", "approx_after_count"]:
                        if k in updates and updates[k] is not None:
                            fields.append(f"`{k}` = %s")
                            values.append(updates[k])
                    
                    fields.append("`last_checked_at` = NOW()")
                    values.append(str(order_id))
                    values.append(str(order_id))
                    query = f"UPDATE `growth_orders` SET {', '.join(fields)} WHERE `id` = %s OR `smm_order_id` = %s;"
                    cursor.execute(query, tuple(values))

                    cursor.execute("SELECT * FROM `growth_orders` WHERE `id` = %s OR `smm_order_id` = %s;", (str(order_id), str(order_id)))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        row["price"] = float(row.get("price", 0))
                        return row
            except Exception as e:
                print(f"MySQL update_order_status notice: {e}")
                if conn:
                    try:
                        conn.close()
                    except Exception:
                        pass

        # Fallback store
        store = load_fallback_store()
        for idx, o in enumerate(store.get("orders", [])):
            if str(o.get("id")) == str(order_id) or str(o.get("smm_order_id")) == str(order_id):
                store["orders"][idx].update(updates)
                store["orders"][idx]["last_checked_at"] = datetime.now().isoformat()
                save_fallback_store(store)
                return store["orders"][idx]
        return None



    def get_orders(self, user_email: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    if user_email and user_email != "all":
                        cursor.execute("SELECT * FROM `growth_orders` WHERE `user_email` = %s ORDER BY `created_at` DESC LIMIT %s;", (user_email.lower().strip(), limit))
                    else:
                        cursor.execute("SELECT * FROM `growth_orders` ORDER BY `created_at` DESC LIMIT %s;", (limit,))
                    rows = cursor.fetchall()
                    for r in rows:
                        r["price"] = float(r["price"])
                    conn.close()
                    return rows
            except Exception as e:
                print(f"MySQL get_orders notice: {e}")
                if conn:
                    conn.close()
        store = load_fallback_store()
        orders = store.get("orders", [])
        if user_email and user_email != "all":
            return [o for o in orders if o.get("user_email") == user_email.lower().strip()][:limit]
        return orders[:limit]

    # --- Wallet Transactions History (Credits & Debits) ---
    def get_transactions(self, user_email: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        clean_email = user_email.lower().strip() if user_email and user_email != "all" else None
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    if clean_email:
                        cursor.execute("""
                        SELECT * FROM `wallet_transactions`
                        WHERE `user_email` = %s
                        ORDER BY `created_at` DESC LIMIT %s;
                        """, (clean_email, limit))
                    else:
                        cursor.execute("""
                        SELECT * FROM `wallet_transactions`
                        ORDER BY `created_at` DESC LIMIT %s;
                        """, (limit,))
                    rows = cursor.fetchall()
                    for r in rows:
                        r["amount"] = float(r.get("amount", 0.0))
                        r["balance_after"] = float(r.get("balance_after", 0.0))
                    conn.close()
                    if rows:
                        return rows
            except Exception as e:
                print(f"MySQL get_transactions notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        txns = store.get("transactions", [])
        if not txns and store.get("orders"):
            for o in store.get("orders", []):
                txns.append({
                    "id": f"TXN-{o.get('id', '')}",
                    "user_email": o.get("user_email", ""),
                    "type": "debit",
                    "amount": float(o.get("price", 0.0)),
                    "balance_after": float(o.get("remaining_wallet_balance", 0.0)),
                    "service_type": o.get("service_type", "followers"),
                    "description": f"{o.get('service_type', 'followers').capitalize()} Boost ({o.get('package_label', '')}) for @{o.get('target_username', '')}",
                    "reference_id": o.get("id", ""),
                    "status": o.get("status", "ordered"),
                    "created_at": o.get("created_at", datetime.now().isoformat())
                })
            store["transactions"] = txns
            save_fallback_store(store)

        if clean_email:
            return [t for t in txns if t.get("user_email", "").lower().strip() == clean_email][:limit]
        return txns[:limit]

    # --- Analytics & Admin Stats ---
    def get_admin_stats(self) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) as total_users, COALESCE(SUM(`wallet_balance`), 0) as total_wallet FROM `users`;")
                    user_stats = cursor.fetchone()
                    total_users = user_stats["total_users"]
                    total_wallet = float(user_stats["total_wallet"])

                    cursor.execute("SELECT COUNT(*) as total_orders, COALESCE(SUM(`price`), 0) as total_revenue FROM `growth_orders`;")
                    order_stats = cursor.fetchone()
                    total_orders = order_stats["total_orders"]
                    total_revenue = float(order_stats["total_revenue"])

                    cursor.execute("SELECT COALESCE(SUM(`package_amount`), 0) as total_followers FROM `growth_orders` WHERE `service_type` = 'followers';")
                    total_followers = cursor.fetchone()["total_followers"]

                    cursor.execute("SELECT COALESCE(SUM(`package_amount`), 0) as total_likes FROM `growth_orders` WHERE `service_type` = 'likes';")
                    total_likes = cursor.fetchone()["total_likes"]

                    cursor.execute("SELECT COALESCE(SUM(`package_amount`), 0) as total_views FROM `growth_orders` WHERE `service_type` = 'views';")
                    total_views = cursor.fetchone()["total_views"]

                    conn.close()
                    return {
                        "total_users": total_users,
                        "total_orders": total_orders,
                        "total_revenue": total_revenue,
                        "total_wallet_balance": round(total_wallet, 2),
                        "total_followers_boosted": total_followers,
                        "total_likes_boosted": total_likes,
                        "total_views_boosted": total_views,
                        "database_engine": "MySQL (Connected)"
                    }
            except Exception as e:
                print(f"MySQL get_admin_stats notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        users = store.get("users", [])
        orders = store.get("orders", [])
        total_revenue = sum(float(o.get("price", 0)) for o in orders)
        total_wallet = sum(float(u.get("wallet_balance", 50.00)) for u in users)
        total_followers = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "followers")
        total_likes = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "likes")
        total_views = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "views")
        return {
            "total_users": len(users),
            "total_orders": len(orders),
            "total_revenue": round(total_revenue, 2),
            "total_wallet_balance": round(total_wallet, 2),
            "total_followers_boosted": total_followers,
            "total_likes_boosted": total_likes,
            "total_views_boosted": total_views,
            "database_engine": "MySQL Ready (Local Buffer)"
        }



db = DatabaseManager()
db.init_tables()
db.init_tables()
