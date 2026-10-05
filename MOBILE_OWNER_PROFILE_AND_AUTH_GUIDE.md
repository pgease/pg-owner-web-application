# 📱 PG Ease — Mobile App Specification Guide: Owner Name in Login & Profile Name/Email Edit

> **Official Implementation Specification for Mobile Applications (Flutter / Android / iOS / React Native)**  
> **Production API Base URL**: `https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api`  
> **Target Audience**: Mobile App Developers & QA Engineers working on the PG Ease Owner App  

---

## 📌 Table of Contents
1. [Overview & Requirements](#1-overview--requirements)
2. [Feature 1: Optional PG Owner Name in Login & Signup](#2-feature-1-optional-pg-owner-name-in-login--signup)
   - [UI/UX Screen Flow](#uiux-screen-flow)
   - [API Request & Response Contracts](#api-request--response-contracts)
   - [Flutter Implementation Example](#flutter-implementation-example-login--signup)
3. [Feature 2: Name & Email Edit Option in PG Owner Side](#3-feature-2-name--email-edit-option-in-pg-owner-side)
   - [UI/UX Screen Flow & Entry Points](#uiux-screen-flow--entry-points)
   - [API Request & Response Contracts](#api-request--response-contracts-profile-update)
   - [Flutter Implementation Example](#flutter-implementation-example-profile-edit-screen--sheet)
4. [Local Storage & State Management Guidelines](#4-local-storage--state-management-guidelines)
5. [Error Handling & Edge Cases](#5-error-handling--edge-cases)
6. [QA & Verification Checklist](#6-qa--verification-checklist)

---

## 1. Overview & Requirements

This document provides complete implementation specifications for two critical features on the PG Ease Owner mobile application:

| Feature | Objective | Backend Endpoints |
|---|---|---|
| **1. Optional PG Owner Name on Login/Signup** | Allow onboarding landlords to provide their real name upfront during phone number authentication (optional). | `POST /property-owners/otp/request`<br>`POST /property-owners/otp/verify` |
| **2. Edit Name & Email in App** | Provide an intuitive screen/sheet inside the app where the landlord can change their display name and contact email address at any time. | `GET /property-owners/me`<br>`PUT /property-owners/me`<br>`PATCH /property-owners/me` |

---

## 2. Feature 1: Optional PG Owner Name on Sign Up (NOT on Sign In)

### UI/UX Screen Flow & Mode Toggle

Landlords who already have an account should only enter their mobile number to **Sign In**. The **PG Owner Name (Optional)** field must only appear when the user is in **Sign Up** mode (or onboarding):

```
┌───────────────────────────────────────────┐
│              PG Ease Owner                │
│                                           │
│       [ Sign In ]   [ Sign Up (Trial) ]   │
│                                           │
│  ────── In SIGN UP Mode: ───────────────  │
│                                           │
│  PG Owner Name (Optional)                 │
│  ┌─────────────────────────────────────┐  │
│  │ 👤 e.g. Rahul Sharma (optional)     │  │
│  └─────────────────────────────────────┘  │
│  Used on tenant receipts & manager profile│
│                                           │
│  Mobile Number                            │
│  ┌────────┬────────────────────────────┐  │
│  │  +91   │  98765 43210               │  │
│  └────────┴────────────────────────────┘  │
│                                           │
│  ────── In SIGN IN Mode: ───────────────  │
│  Only Mobile Number is displayed.         │
│  (Owner Name is hidden!)                  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │     Get OTP via WhatsApp / SMS      │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────┐
│             Verify Mobile                 │
│                                           │
│  Enter 4-digit code sent to +91 9876543210│
│  Registering as: Rahul Sharma (on signup) │
│                                           │
│         [ 1 ] [ 2 ] [ 3 ] [ 4 ]           │
│                                           │
│  Didn't receive code? Resend (30s)        │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │        Verify & Continue            │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

1. **Step 1: Phone Screen & Mode Toggle**
   - **Segmented Control / Tab Switcher**:
     - `Sign In` (default for returning landlords): Only requests 10-digit mobile number.
     - `Sign Up`: Requests **PG Owner Name (Optional)** + 10-digit mobile number.
   - **Owner Name Input (Sign Up Only)**:
     - Label: `PG Owner Name` with `(Optional)` badge.
     - Hint / Helper Text: *"Used on tenant rent receipts and your owner profile."*
     - English placeholder: `e.g. Rahul Sharma (optional)`
     - Hindi placeholder: `उदा. राहुल शर्मा (वैकल्पिक)`
     - Keyboard type: `TextInputType.name`, TextCapitalization: `words`.
   - **Phone Input**:
     - 10-digit numeric phone number with `+91` prefix.
   - **Channel Selector**:
     - WhatsApp (recommended default) or SMS.

2. **Step 2: OTP Verification Screen**
   - The user inputs the 4-digit security code.
   - If in Sign Up mode and the user entered their name in Step 1, display a badge:
     `👤 Registering as: Rahul Sharma`
   - If in Sign In mode, no name badge is shown.
   - When the user enters the 4th digit (or presses "Verify"), the name is sent to `POST /property-owners/otp/verify`.

---

### API Request & Response Contracts

#### 1. Request OTP (Optional metadata)
- **Method**: `POST`
- **URL**: `https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api/property-owners/otp/request`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "mobileNumber": "9876543210",
    "channel": "whatsapp",
    "name": "Rahul Sharma",
    "pgOwnerName": "Rahul Sharma"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "message": "OTP sent successfully",
    "expiresIn": 600
  }
  ```

#### 2. Verify OTP & Authenticate
- **Method**: `POST`
- **URL**: `https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api/property-owners/otp/verify`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "mobileNumber": "9876543210",
    "otp": "1234",
    "name": "Rahul Sharma",
    "pgOwnerName": "Rahul Sharma",
    "ownerName": "Rahul Sharma"
  }
  ```
  *(Note: If the owner left the field blank, omit `name` / `pgOwnerName` or pass `null`/empty string; the backend will generate a default fallback name e.g. `user_3210`)*.

- **Response (`200 OK`)**:
  ```json
  {
    "userType": "owner",
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "isNewUser": false,
    "hasProperties": true,
    "propertyCount": 2,
    "propertyOwner": {
      "id": "962936c2-e9d9-424c-bb51-5b2f65ec6fd7",
      "name": "Rahul Sharma",
      "email": "user_3210@pgease.local",
      "mobileContactNumber": "9876543210",
      "countryCode": "+91",
      "language": "en-US",
      "createdAt": "2026-10-02T08:20:03.000Z"
    }
  }
  ```

---

### Flutter Implementation Example (Login & Signup)

```dart
// lib/features/auth/services/auth_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthApiService {
  static const String baseUrl = 'https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api';

  /// Request OTP for Property Owner
  static Future<bool> requestOtp({
    required String mobileNumber,
    String channel = 'whatsapp',
    String? name,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/property-owners/otp/request'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'mobileNumber': mobileNumber,
        'channel': channel,
        if (name != null && name.trim().isNotEmpty) ...{
          'name': name.trim(),
          'pgOwnerName': name.trim(),
        },
      }),
    );
    return response.statusCode == 200;
  }

  /// Verify OTP and return session payload
  static Future<Map<String, dynamic>> verifyOtp({
    required String mobileNumber,
    required String otp,
    String? name,
  }) async {
    final body = <String, dynamic>{
      'mobileNumber': mobileNumber,
      'otp': otp,
    };
    if (name != null && name.trim().isNotEmpty) {
      body['name'] = name.trim();
      body['pgOwnerName'] = name.trim();
      body['ownerName'] = name.trim();
    }

    final response = await http.post(
      Uri.parse('$baseUrl/property-owners/otp/verify'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to verify OTP');
    }
  }
}
```

#### Flutter UI Snippet (`login_screen.dart`):

```dart
// lib/features/auth/screens/login_screen.dart
class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  String _selectedChannel = 'whatsapp';
  bool _isLoading = false;

  void _onSendOtpPressed() async {
    final phone = _phoneController.text.trim();
    final name = _nameController.text.trim();

    if (phone.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit mobile number')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final success = await AuthApiService.requestOtp(
        mobileNumber: phone,
        channel: _selectedChannel,
        name: name.isNotEmpty ? name : null,
      );

      if (success && mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OtpVerificationScreen(
              mobileNumber: phone,
              ownerName: name.isNotEmpty ? name : null,
              channel: _selectedChannel,
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('PG Owner Sign In', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),

              // Optional PG Owner Name
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('PG Owner Name', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(12)),
                    child: const Text('Optional', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.person_outline, size: 20),
                  hintText: 'e.g. Rahul Sharma (optional)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),

              // Mobile Number
              const Text('Mobile Number', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                decoration: InputDecoration(
                  counterText: '',
                  prefixText: '+91 ',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _onSendOtpPressed,
                child: _isLoading ? const CircularProgressIndicator() : const Text('Send Verification Code'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 3. Feature 2: Name & Email Edit Option in PG Owner Side

### UI/UX Screen Flow & Entry Points

Landlords should be able to edit their **Name** and **Email** from two intuitive mobile locations:
1. **Side Navigation Drawer / Profile Header**: Tapping the landlord avatar or pencil icon next to their name.
2. **Settings / Account Tab**: An explicit **"Edit Profile (Name & Email)"** list tile.

```
┌───────────────────────────────────────────┐
│               Edit Profile                │
│                                           │
│                  ┌───┐                    │
│                  │VK │                    │
│                  └───┘                    │
│                                           │
│  Full Name *                              │
│  ┌─────────────────────────────────────┐  │
│  │ 👤 Vikas Kuntal                     │  │
│  └─────────────────────────────────────┘  │
│  Appears on tenant rent receipts.         │
│                                           │
│  Registered Email                         │
│  ┌─────────────────────────────────────┐  │
│  │ ✉️ vikas@pgease.com                 │  │
│  └─────────────────────────────────────┘  │
│  Used for financial & tax statements.     │
│                                           │
│  Mobile Number (Primary Account)          │
│  ┌─────────────────────────────────────┐  │
│  │ 🔒 +91 89202 15953                  │  │
│  └─────────────────────────────────────┘  │
│  Linked to OTP credentials.               │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │            Save Changes             │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

---

### API Request & Response Contracts (Profile Update)

#### 1. Fetch Current Profile (`GET /property-owners/me`)
- **Method**: `GET`
- **URL**: `https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api/property-owners/me`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "id": "38732886-744c-4e5f-bd16-872b436494a3",
    "name": "Vikas Kuntal",
    "email": "vikas@pgease.com",
    "mobileContactNumber": "8920215953",
    "countryCode": "+91",
    "language": "en-US",
    "createdAt": "2026-09-20T10:00:00.000Z"
  }
  ```

#### 2. Update Profile Name & Email (`PUT /property-owners/me` or `PATCH /property-owners/me`)
- **Method**: `PUT` or `PATCH`
- **URL**: `https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api/property-owners/me`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "name": "Vikas Kuntal",
    "email": "vikas.kuntal@pgease.com"
  }
  ```
  *(Note: You can pass just `name`, just `email`, or both. Whitespace is automatically trimmed by the backend)*.

- **Success Response (`200 OK`)**:
  ```json
  {
    "id": "38732886-744c-4e5f-bd16-872b436494a3",
    "name": "Vikas Kuntal",
    "email": "vikas.kuntal@pgease.com",
    "mobileContactNumber": "8920215953",
    "countryCode": "+91",
    "language": "en-US",
    "createdAt": "2026-09-20T10:00:00.000Z"
  }
  ```

- **Conflict Error Response (`400 Bad Request`)**:
  If another registered owner is already using this email address:
  ```json
  {
    "statusCode": 400,
    "message": "This email address is already in use by another account",
    "error": "Bad Request"
  }
  ```

---

### Flutter Implementation Example (Profile Edit Screen / Sheet)

#### Profile Service Method:
```dart
// lib/features/profile/services/profile_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ProfileApiService {
  static const String baseUrl = 'https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api';

  /// Update owner name and/or email
  static Future<Map<String, dynamic>> updateOwnerProfile({
    required String accessToken,
    required String name,
    String? email,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/property-owners/me'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'name': name.trim(),
        'email': (email != null && email.trim().isNotEmpty) ? email.trim() : null,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data as Map<String, dynamic>;
    } else {
      throw Exception(data['message'] ?? 'Failed to update profile');
    }
  }
}
```

#### Edit Profile Bottom Sheet Widget:
```dart
// lib/features/profile/widgets/edit_profile_bottom_sheet.dart
import 'package:flutter/material.dart';

class EditProfileBottomSheet extends StatefulWidget {
  final String currentName;
  final String? currentEmail;
  final String mobileNumber;
  final String accessToken;
  final Function(String newName, String? newEmail) onProfileUpdated;

  const EditProfileBottomSheet({
    Key? key,
    required this.currentName,
    this.currentEmail,
    required this.mobileNumber,
    required this.accessToken,
    required this.onProfileUpdated,
  }) : super(key: key);

  static void show(
    BuildContext context, {
    required String currentName,
    String? currentEmail,
    required String mobileNumber,
    required String accessToken,
    required Function(String, String?) onProfileUpdated,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => EditProfileBottomSheet(
        currentName: currentName,
        currentEmail: currentEmail,
        mobileNumber: mobileNumber,
        accessToken: accessToken,
        onProfileUpdated: onProfileUpdated,
      ),
    );
  }

  @override
  State<EditProfileBottomSheet> createState() => _EditProfileBottomSheetState();
}

class _EditProfileBottomSheetState extends State<EditProfileBottomSheet> {
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.currentName);
    _emailController = TextEditingController(text: widget.currentEmail ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();

    if (name.isEmpty) {
      setState(() => _errorMessage = 'Full name cannot be empty');
      return;
    }

    if (email.isNotEmpty) {
      final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
      if (!emailRegex.hasMatch(email)) {
        setState(() => _errorMessage = 'Please enter a valid email address');
        return;
      }
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final updated = await ProfileApiService.updateOwnerProfile(
        accessToken: widget.accessToken,
        name: name,
        email: email.isNotEmpty ? email : null,
      );

      widget.onProfileUpdated(updated['name'], updated['email']);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully! ✨'),
            backgroundColor: Color(0xFF008080),
          ),
        );
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: bottomInset + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Edit Owner Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
            ],
          ),
          const SizedBox(height: 12),

          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, size: 18, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12))),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Name Field
          const Text('Full Name *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.person_outline, size: 20),
              hintText: 'e.g. Rahul Sharma',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 14),

          // Email Field
          const Text('Registered Email', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.mail_outline, size: 20),
              hintText: 'e.g. owner@example.com',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 14),

          // Read-only Phone
          const Text('Registered Mobile (Primary Account)', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Row(
              children: [
                const Icon(Icons.lock_outline, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text('+91 ${widget.mobileNumber}', style: const TextStyle(fontSize: 13, color: Colors.black82)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF008080),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _isSaving ? null : _handleSave,
              child: _isSaving
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Save Changes', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 4. Local Storage & State Management Guidelines

1. **Persistent Cache (`SharedPreferences` / `flutter_secure_storage`)**:
   - When `verifyOtp` succeeds, store:
     - `pgease_access_token`
     - `pgease_refresh_token`
     - `pgease_owner_id`
     - `pgease_owner_name`
     - `pgease_owner_email`
   - When `updateOwnerProfile` succeeds, **immediately update the cached name and email** in `SharedPreferences`.
2. **App-wide State Refresh (Riverpod / Provider / Bloc)**:
   - Provide a `userProfileProvider` or `authNotifier`.
   - Updating the profile should call `state = state.copyWith(name: newName, email: newEmail)`.
   - The Drawer header, Home App Bar greeting (`"Hello, Rahul!"`), and Settings screen should automatically update reactively without requiring an app restart.

---

## 5. Error Handling & Edge Cases

| Scenario | Expected Mobile Behavior |
|---|---|
| **User leaves Name blank on Signup** | Pass `null` or omit `name`. Backend auto-generates a name (e.g. `user_5953`). Screen continues smoothly. |
| **Existing user enters new Name on Login** | Backend updates their name if previously a placeholder (`user_xxxx`), ensuring their real name is saved. |
| **User enters duplicate Email on Edit** | Backend returns `400 Bad Request` with message *"This email address is already in use by another account"*. Show an inline error banner on the sheet. |
| **Invalid Email format** | Validate client-side before sending HTTP request using regex `r'^[^@]+@[^@]+\.[^@]+$'`. |
| **Network timeout / offline** | Show Retry SnackBar: *"Unable to connect to PG Ease server. Please check your internet connection."* |
| **Empty Name submitted on Edit** | Block submission client-side: *"Full name is required"*. |

---

## 6. QA & Verification Checklist

- [ ] **Login Screen**:
  - [ ] PG Owner Name field is visible above the phone input.
  - [ ] "Optional" tag is clearly visible next to the label.
  - [ ] Leaving name empty allows successful OTP request and verification.
  - [ ] Providing a name creates the account with that exact name upon first verification.
  - [ ] OTP screen shows the user's name if entered.
  - [ ] Navigating back to the phone screen retains the typed name.
- [ ] **Profile Edit Screen / Bottom Sheet**:
  - [ ] User can open "Edit Profile" from the Drawer header and Settings screen.
  - [ ] Existing name and email prefill the text fields.
  - [ ] Changing name and saving updates the name immediately on Home / Drawer / Receipts.
  - [ ] Changing email and saving updates the email in the backend and local storage.
  - [ ] Entering an invalid email format triggers validation error.
  - [ ] Entering an email already taken by another landlord shows friendly conflict error.
  - [ ] Mobile number is displayed as read-only.
