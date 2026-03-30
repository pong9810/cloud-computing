from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

A_URL = 'http://電腦A的實際IP'  # ← 記得換成電腦A的實際IP

def calculate_salary(emp):
    tutoring = emp.get('補習班時數', 0) * emp.get('補習班時薪', 0)
    home_tutor = emp.get('家教時數', 0) * emp.get('家教時薪', 0)
    business = emp.get('出差天數', 0) * emp.get('出差津貼', 0)
    bonus = emp.get('獎金', 0)
    deduction = emp.get('扣款', 0)
    return tutoring + home_tutor + business + bonus - deduction

# 計算全部員工薪資，並回傳摘要（給C電腦的首頁用）
@app.route('/calculate/all', methods=['GET'])
def calculate_all():
    try:
        res = requests.get(f'{A_URL}/api/employees')
        employees = res.json()
    except Exception:
        return jsonify({'error': '無法連線到電腦A'}), 500

    result = []
    total_salary = 0
    department_totals = {}
    highest = None
    lowest = None

    for emp in employees:
        salary = calculate_salary(emp)
        emp['個人薪資'] = salary
        total_salary += salary

        dept = emp.get('部門', '未知')
        department_totals[dept] = department_totals.get(dept, 0) + salary

        if highest is None or salary > highest['個人薪資']:
            highest = emp
        if lowest is None or salary < lowest['個人薪資']:
            lowest = emp

        result.append(emp)

        # 把計算結果存回 A
        requests.put(f'{A_URL}/api/employees/{emp["員工編號"]}', json=emp)

    avg = total_salary / len(result) if result else 0

    return jsonify({
        'employees': result,
        'total_salary': {
            'employee_count': len(result),
            'total_salary': total_salary,
            'average_salary': avg,
            'department_totals': department_totals,
            'highest_paid': highest,
            'lowest_paid': lowest
        }
    })

# 計算單一員工薪資
@app.route('/calculate/<string:emp_id>', methods=['GET'])
def calculate_personal(emp_id):
    try:
        res = requests.get(f'{A_URL}/api/employees/{emp_id}')
        if res.status_code == 404:
            return jsonify({'error': '找不到員工'}), 404
        emp = res.json()
    except Exception:
        return jsonify({'error': '無法連線到電腦A'}), 500

    salary = calculate_salary(emp)
    emp['個人薪資'] = salary

    # 存回 A
    requests.put(f'{A_URL}/api/employees/{emp_id}', json=emp)

    return jsonify({
        '員工編號': emp['員工編號'],
        '姓名': emp['姓名'],
        '部門': emp['部門'],
        '補習班薪資': emp.get('補習班時數', 0) * emp.get('補習班時薪', 0),
        '家教薪資': emp.get('家教時數', 0) * emp.get('家教時薪', 0),
        '出差津貼小計': emp.get('出差天數', 0) * emp.get('出差津貼', 0),
        '獎金': emp.get('獎金', 0),
        '扣款': emp.get('扣款', 0),
        '個人薪資': salary
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)