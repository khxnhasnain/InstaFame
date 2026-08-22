import os
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
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
    "rate_per_1000_followers": 8.00,
    "rate_per_1000_likes": 4.00,
    "currency": "USD"
}

def generate_default_packages(rate_followers: float = 8.00, rate_likes: float = 4.00) -> List[Dict[str, Any]]:
    return [
        # Followers Packages: 1k, 10k, 100k, 1M
        {
            "id": "pkg_followers_1k",
            "service_type": "followers",
            "amount": 1000,
            "label": "1K Followers",
            "price": round((1000 / 1000.0) * rate_followers, 2),
            "currency": "USD",
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
            "currency": "USD",
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
            "currency": "USD",
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
            "currency": "USD",
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
            "currency": "USD",
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
            "currency": "USD",
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
            "currency": "USD",
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
            "currency": "USD",
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
        "orders": []
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
                    `rate_per_1000_followers` DECIMAL(10, 2) NOT NULL DEFAULT 8.00,
                    `rate_per_1000_likes` DECIMAL(10, 2) NOT NULL DEFAULT 4.00,
                    `currency` VARCHAR(16) DEFAULT 'USD',
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # 2. Packages table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `packages` (
                    `id` VARCHAR(64) PRIMARY KEY,
                    `service_type` VARCHAR(32) NOT NULL,
                    `amount` INT NOT NULL,
                    `label` VARCHAR(128) NOT NULL,
                    `price` DECIMAL(10, 2) NOT NULL,
                    `currency` VARCHAR(16) DEFAULT 'USD',
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
                    `last_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # 4. Growth Orders table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS `growth_orders` (
                    `id` VARCHAR(64) PRIMARY KEY,
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
                    `status` VARCHAR(32) DEFAULT 'ordered',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)

                # Fetch current rate
                cursor.execute("SELECT * FROM `pricing_settings` WHERE `id` = 'global_rates';")
                current_rate = cursor.fetchone()
                rf = float(current_rate["rate_per_1000_followers"]) if current_rate else 8.00
                rl = float(current_rate["rate_per_1000_likes"]) if current_rate else 4.00

                if not current_rate:
                    cursor.execute("""
                    INSERT INTO `pricing_settings` (`id`, `rate_per_1000_followers`, `rate_per_1000_likes`, `currency`)
                    VALUES ('global_rates', %s, %s, 'USD');
                    """, (rf, rl))

                # Refresh packages to ensure 1k, 10k, 100k, 1M are seeded
                for pkg in generate_default_packages(rf, rl):
                    cursor.execute("""
                    INSERT INTO `packages` (`id`, `service_type`, `amount`, `label`, `price`, `currency`, `popular`, `tag`, `is_active`)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        `amount` = VALUES(`amount`),
                        `label` = VALUES(`label`),
                        `price` = VALUES(`price`),
                        `popular` = VALUES(`popular`),
                        `tag` = VALUES(`tag`);
                    """, (
                        pkg["id"], pkg["service_type"], pkg["amount"], pkg["label"],
                        pkg["price"], pkg["currency"], pkg["popular"], pkg["tag"], pkg["is_active"]
                    ))

                # Delete legacy small amount packages (e.g. 250, 500, 2500, 5000)
                cursor.execute("DELETE FROM `packages` WHERE `amount` NOT IN (1000, 10000, 100000, 1000000);")

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

    # --- Master Rates (Per 1,000 Followers & Likes) ---
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
                            "rate_per_1000_followers": float(row["rate_per_1000_followers"]),
                            "rate_per_1000_likes": float(row["rate_per_1000_likes"]),
                            "currency": row.get("currency", "USD")
                        }
            except Exception as e:
                print(f"MySQL get_pricing_rates notice: {e}")
                if conn:
                    conn.close()

        store = load_fallback_store()
        return store.get("rates", DEFAULT_RATES)

    def update_pricing_rates(self, rate_followers: float, rate_likes: float, auto_update_packages: bool = True) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    INSERT INTO `pricing_settings` (`id`, `rate_per_1000_followers`, `rate_per_1000_likes`, `currency`)
                    VALUES ('global_rates', %s, %s, 'USD')
                    ON DUPLICATE KEY UPDATE
                        `rate_per_1000_followers` = VALUES(`rate_per_1000_followers`),
                        `rate_per_1000_likes` = VALUES(`rate_per_1000_likes`),
                        `updated_at` = NOW();
                    """, (rate_followers, rate_likes))

                    if auto_update_packages:
                        # Clean old packages and re-insert 1k, 10k, 100k, 1M
                        cursor.execute("DELETE FROM `packages` WHERE `amount` NOT IN (1000, 10000, 100000, 1000000);")
                        new_pkgs = generate_default_packages(rate_followers, rate_likes)
                        for p in new_pkgs:
                            cursor.execute("""
                            INSERT INTO `packages` (`id`, `service_type`, `amount`, `label`, `price`, `currency`, `popular`, `tag`, `is_active`)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE
                                `price` = VALUES(`price`),
                                `amount` = VALUES(`amount`),
                                `label` = VALUES(`label`),
                                `tag` = VALUES(`tag`),
                                `popular` = VALUES(`popular`);
                            """, (
                                p["id"], p["service_type"], p["amount"], p["label"],
                                p["price"], p["currency"], p["popular"], p["tag"], p["is_active"]
                            ))

                conn.close()
                return {"rate_per_1000_followers": rate_followers, "rate_per_1000_likes": rate_likes, "currency": "USD"}
            except Exception as e:
                print(f"MySQL update_pricing_rates notice: {e}")
                if conn:
                    conn.close()

        # Fallback store
        store = load_fallback_store()
        store["rates"] = {"id": "global_rates", "rate_per_1000_followers": rate_followers, "rate_per_1000_likes": rate_likes, "currency": "USD"}
        if auto_update_packages:
            store["packages"] = generate_default_packages(rate_followers, rate_likes)
        save_fallback_store(store)
        return store["rates"]

    # --- Packages / Dynamic Pricing Management ---
    def get_packages(self, service_type: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
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
        rates = self.get_pricing_rates()
        pkgs = generate_default_packages(rates.get("rate_per_1000_followers", 8.0), rates.get("rate_per_1000_likes", 4.0))
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

    # --- Login Users Management ---
    def sync_login_user(self, user_id: str, email: str, name: str, avatar_url: str = "", provider: str = "google", role: str = "user") -> Dict[str, Any]:
        clean_email = email.lower().strip()
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    INSERT INTO `users` (`id`, `email`, `name`, `avatar_url`, `provider`, `role`, `last_login`)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
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
                    conn.close()
                    return rows
            except Exception as e:
                print(f"MySQL get_users notice: {e}")
                if conn:
                    conn.close()
        store = load_fallback_store()
        return store.get("users", [])

    # --- Growth Orders (Followers & Likes Boost Records) ---
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        order_id = order_data.get("id") or f"ORD-{int(time.time() * 1000) % 1000000:06d}"
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
        status = order_data.get("status") or "ordered"

        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                    INSERT INTO `growth_orders` (
                        `id`, `user_email`, `service_type`, `target_username`, `target_post_url`,
                        `package_amount`, `package_label`, `price`, `initial_count`,
                        `approx_after_count`, `current_count`, `status`
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        order_id, user_email, service_type, target_username, target_post_url,
                        package_amount, package_label, price, initial_count,
                        approx_after_count, current_count, status
                    ))
                    cursor.execute("UPDATE `users` SET `total_orders_count` = `total_orders_count` + 1 WHERE `email` = %s;", (user_email,))
                    cursor.execute("SELECT * FROM `growth_orders` WHERE `id` = %s;", (order_id,))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        row["price"] = float(row["price"])
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
            "status": status,
            "created_at": datetime.now().isoformat()
        }
        orders.insert(0, order_obj)
        store["orders"] = orders
        for u in store.get("users", []):
            if u.get("email") == user_email:
                u["total_orders_count"] = u.get("total_orders_count", 0) + 1
        save_fallback_store(store)
        return order_obj

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

    # --- Analytics & Admin Stats ---
    def get_admin_stats(self) -> Dict[str, Any]:
        conn = self.get_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) as total_users FROM `users`;")
                    total_users = cursor.fetchone()["total_users"]

                    cursor.execute("SELECT COUNT(*) as total_orders, COALESCE(SUM(`price`), 0) as total_revenue FROM `growth_orders`;")
                    order_stats = cursor.fetchone()
                    total_orders = order_stats["total_orders"]
                    total_revenue = float(order_stats["total_revenue"])

                    cursor.execute("SELECT COALESCE(SUM(`package_amount`), 0) as total_followers FROM `growth_orders` WHERE `service_type` = 'followers';")
                    total_followers = cursor.fetchone()["total_followers"]

                    cursor.execute("SELECT COALESCE(SUM(`package_amount`), 0) as total_likes FROM `growth_orders` WHERE `service_type` = 'likes';")
                    total_likes = cursor.fetchone()["total_likes"]

                    conn.close()
                    return {
                        "total_users": total_users,
                        "total_orders": total_orders,
                        "total_revenue": total_revenue,
                        "total_followers_boosted": total_followers,
                        "total_likes_boosted": total_likes,
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
        total_followers = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "followers")
        total_likes = sum(int(o.get("package_amount", 0)) for o in orders if o.get("service_type") == "likes")
        return {
            "total_users": len(users),
            "total_orders": len(orders),
            "total_revenue": round(total_revenue, 2),
            "total_followers_boosted": total_followers,
            "total_likes_boosted": total_likes,
            "database_engine": "MySQL Ready (Local Buffer)"
        }

db = DatabaseManager()
db.init_tables()
