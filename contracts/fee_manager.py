# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

TREASURY_DEFAULT = "0xFe0Af9457074A2FD685425865F71ac925ad9c3D9"

FEE_START_GAME  = 1_000_000_000_000_000_000
FEE_JUDGE_GAME  = 1_500_000_000_000_000_000
FEE_JOIN_TOURNAMENT = 0


class FeeManager(gl.Contract):
    owner:        str
    treasury:     str
    fees:         TreeMap[str, str]  # method → fee_wei (stored as str)
    collected:    u64
    authorized:   TreeMap[str, str]  # address → "1" (can call collect_fee)

    def __init__(self, treasury: str):
        self.owner     = str(gl.message.sender_address).lower()
        self.treasury  = treasury.strip().lower() if treasury else TREASURY_DEFAULT
        self.collected = u64(0)
        self.fees["start_game"]       = str(FEE_START_GAME)
        self.fees["judge_game"]       = str(FEE_JUDGE_GAME)
        self.fees["join_tournament"]  = str(FEE_JOIN_TOURNAMENT)

    def _only_owner(self):
        if str(gl.message.sender_address).lower() != self.owner:
            raise gl.vm.UserError("[EXPECTED] Owner only")

    def _only_authorized(self):
        caller = str(gl.message.sender_address).lower()
        if caller != self.owner and caller not in self.authorized:
            raise gl.vm.UserError("[EXPECTED] Not authorized")

    @gl.public.write.payable
    def collect_fee(self, method: str) -> str:
        method = method.strip().lower()
        if method not in self.fees:
            raise gl.vm.UserError(f"[EXPECTED] Unknown method: {method}")
        required = int(self.fees[method])
        if required > 0 and int(gl.message.value) < required:
            raise gl.vm.UserError(f"[EXPECTED] {method} requires {required} wei fee")
        self.collected = u64(int(self.collected) + int(gl.message.value))
        return f"Fee accepted: {gl.message.value} wei for {method}"

    @gl.public.write
    def authorize_caller(self, address: str) -> str:
        self._only_owner()
        addr = address.strip().lower()
        self.authorized[addr] = "1"
        return f"Authorized: {addr}"

    @gl.public.write
    def revoke_caller(self, address: str) -> str:
        self._only_owner()
        addr = address.strip().lower()
        if addr in self.authorized:
            del self.authorized[addr]
        return f"Revoked: {addr}"

    @gl.public.write
    def set_fee(self, method: str, fee_wei: int) -> str:
        self._only_owner()
        self.fees[method.strip().lower()] = str(fee_wei)
        return f"Fee updated: {method} = {fee_wei} wei"

    @gl.public.write
    def set_treasury(self, address: str) -> str:
        self._only_owner()
        self.treasury = address.strip().lower()
        return f"Treasury updated: {self.treasury}"

    @gl.public.write
    def withdraw(self, amount: int) -> str:
        self._only_owner()
        bal = int(self.collected)
        if amount > bal:
            raise gl.vm.UserError(f"[EXPECTED] Insufficient balance: {bal}")
        self.collected = u64(bal - amount)
        return f"Withdraw {amount} wei to {self.treasury} (tracked)"

    @gl.public.view
    def get_fee(self, method: str) -> int:
        method = method.strip().lower()
        if method not in self.fees:
            return 0
        return int(self.fees[method])

    @gl.public.view
    def get_balance(self) -> int:
        return int(self.collected)

    @gl.public.view
    def get_all_fees(self) -> dict:
        result = {}
        for k in self.fees:
            result[k] = int(self.fees[k])
        return result

    @gl.public.view
    def get_treasury(self) -> str:
        return self.treasury
