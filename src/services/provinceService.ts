import type { ApiResponse } from "../types/api";
import api from "./apiService";

export interface ProvinceData {
  id?: string; // Có thể không có nếu API chỉ trả về code, name
  code: string;
  name: string;
  type: string; // "tinh" | "thanh-pho"
  nameWithType: string; // "Tỉnh An Giang", "Thành phố Đà Nẵng"
  slug?: string;
}

export interface ProvinceListResponse {
  count: number;
  data: ProvinceData[];
}

const provinceService = {
  /**
   * Lấy toàn bộ danh sách tỉnh/thành phố
   * API ví dụ trả về:
   * {
   *   "count": 34,
   *   "data": [{ "code": "17", "name": "An Giang", ... }]
   * }
   */
  async getAllProvinces(): Promise<ApiResponse<ProvinceListResponse>> {
    try {
      const res = await api.get("/account/provinces");
      console.log("Fetched provinces:", res);
      return res;
    } catch (error: any) {
      console.error("Failed to fetch provinces:", error.message || error);
      throw error;
    }
  },

  async getProvinceByCode(code: string): Promise<ApiResponse<ProvinceData>> {
    try {
      const res = await api.get(`/province/${code}`);
      console.log(`Province [${code}]:`, res);
      return res;
    } catch (error: any) {
      console.error(`Failed to fetch province code=${code}:`, error.message || error);
      throw error;
    }
  },

  async searchProvinces(keyword: string): Promise<ApiResponse<ProvinceListResponse>> {
    try {
      const res = await api.get(`/province?search=${encodeURIComponent(keyword)}`);
      console.log(`Search provinces "${keyword}" =>`, res);
      return res;
    } catch (error: any) {
      console.error("Failed to search provinces:", error.message || error);
      throw error;
    }
  },
};

export default provinceService;
