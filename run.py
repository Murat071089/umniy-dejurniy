"""
Умный дежурный — Telegram-бот для студентов.
Точка входа для запуска бота.
Корректно завершается при любом способе закрытия (Ctrl+C, закрытие терминала, kill).
"""

import asyncio
import signal
import sys
import os
import socket

# Добавляем корневую директорию в путь
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.main import main

# Глобальная переменная для удержания сокета блокировки
_lock_socket = None


def prevent_multiple_instances(port: int = 23456) -> None:
    """Гарантирует, что запущен только один экземпляр бота на этом хосте."""
    global _lock_socket
    try:
        _lock_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        _lock_socket.bind(("127.0.0.1", port))
    except socket.error:
        print("\n" + "=" * 70)
        print("[!] ОШИБКА: Еще один экземпляр бота уже запущен!")
        print("Telegram-бот не может работать в двух экземплярах одновременно,")
        print("так как они будут перехватывать сообщения друг у друга.")
        print("Пожалуйста, закройте другие процессы бота перед запуском.")
        print("=" * 70 + "\n")
        sys.exit(1)


def _handle_shutdown(signum, frame):
    """Обработчик сигналов завершения — корректно останавливает event loop."""
    print(f"\n[!] Poluchyn signal zaversheniya ({signum}). Ostanovka...")
    raise SystemExit(0)


if __name__ == "__main__":
    # Проверяем, не запущен ли уже бот
    prevent_multiple_instances()

    # Перехватываем сигналы завершения (закрытие терминала, kill и т.д.)
    signal.signal(signal.SIGTERM, _handle_shutdown)
    # SIGBREAK — сигнал Windows при закрытии окна консоли
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, _handle_shutdown)

    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        print("\nBot stopped.")

