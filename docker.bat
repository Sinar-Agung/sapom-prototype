@echo off
REM SAPOM Docker Helper Script for Windows
REM Usage: docker.bat [command]

setlocal enabledelayedexpansion

set PROJECT_NAME=sapom-prototype

if "%1"=="" goto usage

if "%1"=="build-prod" goto build_prod
if "%1"=="build-dev" goto build_dev
if "%1"=="run-prod" goto run_prod
if "%1"=="run-dev" goto run_dev
if "%1"=="start" goto start
if "%1"=="start-dev" goto start_dev
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="logs-follow" goto logs_follow
if "%1"=="shell" goto shell
if "%1"=="shell-dev" goto shell_dev
if "%1"=="clean" goto clean
if "%1"=="clean-all" goto clean_all
if "%1"=="health" goto health
if "%1"=="status" goto status
goto usage

:usage
echo.
echo SAPOM Docker Helper Script
echo.
echo Usage: docker.bat [command]
echo.
echo Commands:
echo   build-prod       Build production Docker image
echo   build-dev        Build development Docker image
echo   run-prod         Run production container (port 8080)
echo   run-dev          Run development container (port 5173)
echo   start            Start containers with docker-compose (production)
echo   start-dev        Start containers with docker-compose (development)
echo   stop             Stop all containers
echo   restart          Restart containers
echo   logs             Show container logs
echo   logs-follow      Follow container logs
echo   shell            Open shell in production container
echo   shell-dev        Open shell in development container
echo   clean            Remove containers and images
echo   clean-all        Remove everything (containers, images, volumes)
echo   health           Check container health
echo   status           Show container status
echo.
goto end

:build_prod
echo Building production image...
docker build -t %PROJECT_NAME%:latest -t %PROJECT_NAME%:prod .
if %errorlevel% equ 0 (
    echo [SUCCESS] Production image built successfully
) else (
    echo [ERROR] Failed to build production image
)
goto end

:build_dev
echo Building development image...
docker build -f Dockerfile.dev -t %PROJECT_NAME%:dev .
if %errorlevel% equ 0 (
    echo [SUCCESS] Development image built successfully
) else (
    echo [ERROR] Failed to build development image
)
goto end

:run_prod
echo Starting production container...
docker run -d -p 8080:80 --name %PROJECT_NAME%-prod %PROJECT_NAME%:prod
if %errorlevel% equ 0 (
    echo [SUCCESS] Production container started
    echo Access at: http://localhost:8080
) else (
    echo [ERROR] Failed to start production container
)
goto end

:run_dev
echo Starting development container...
docker run -d -p 5173:5173 -v "%cd%:/app" -v /app/node_modules --name %PROJECT_NAME%-dev %PROJECT_NAME%:dev
if %errorlevel% equ 0 (
    echo [SUCCESS] Development container started
    echo Access at: http://localhost:5173
) else (
    echo [ERROR] Failed to start development container
)
goto end

:start
echo Starting production with docker-compose...
docker-compose --profile prod up -d
if %errorlevel% equ 0 (
    echo [SUCCESS] Production containers started
    echo Access at: http://localhost:8080
) else (
    echo [ERROR] Failed to start containers
)
goto end

:start_dev
echo Starting development with docker-compose...
docker-compose --profile dev up -d
if %errorlevel% equ 0 (
    echo [SUCCESS] Development containers started
    echo Access at: http://localhost:5173
) else (
    echo [ERROR] Failed to start containers
)
goto end

:stop
echo Stopping containers...
docker-compose down 2>nul
docker stop %PROJECT_NAME%-prod 2>nul
docker stop %PROJECT_NAME%-dev 2>nul
echo [SUCCESS] Containers stopped
goto end

:restart
call :stop
echo Restarting containers...
call :start
goto end

:logs
echo Container logs:
docker-compose logs --tail=100 2>nul || docker logs %PROJECT_NAME%-prod 2>nul || docker logs %PROJECT_NAME%-dev 2>nul || echo No running containers found
goto end

:logs_follow
echo Following container logs (Ctrl+C to exit):
docker-compose logs -f 2>nul || docker logs -f %PROJECT_NAME%-prod 2>nul || docker logs -f %PROJECT_NAME%-dev 2>nul || echo No running containers found
goto end

:shell
echo Opening shell in production container...
docker exec -it %PROJECT_NAME%-prod sh 2>nul || docker exec -it sapom-prod sh 2>nul || echo Production container not running
goto end

:shell_dev
echo Opening shell in development container...
docker exec -it %PROJECT_NAME%-dev sh 2>nul || docker exec -it sapom-dev sh 2>nul || echo Development container not running
goto end

:clean
echo Cleaning containers and images...
docker-compose down 2>nul
docker rm -f %PROJECT_NAME%-prod %PROJECT_NAME%-dev 2>nul
docker rmi %PROJECT_NAME%:latest %PROJECT_NAME%:prod %PROJECT_NAME%:dev 2>nul
echo [SUCCESS] Cleaned up
goto end

:clean_all
echo WARNING: This will remove all containers, images, and volumes!
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    echo Cleaning everything...
    docker-compose down -v 2>nul
    docker rm -f %PROJECT_NAME%-prod %PROJECT_NAME%-dev 2>nul
    docker rmi %PROJECT_NAME%:latest %PROJECT_NAME%:prod %PROJECT_NAME%:dev 2>nul
    docker volume prune -f
    echo [SUCCESS] Everything cleaned
) else (
    echo Cancelled
)
goto end

:health
echo Checking container health...
docker ps --format "{{.Names}}" | findstr /C:"%PROJECT_NAME%-prod" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr /C:"%PROJECT_NAME%-prod"') do set container=%%i
    for /f "tokens=*" %%i in ('docker inspect --format="{{.State.Health.Status}}" !container! 2^>nul') do set health_status=%%i
    if "!health_status!"=="" set health_status=no health check
    echo Production: !health_status!
    
    curl -s http://localhost:8080/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo   Health endpoint: accessible
    ) else (
        echo   Health endpoint: not accessible
    )
) else (
    echo Production container not running
)

docker ps --format "{{.Names}}" | findstr /C:"%PROJECT_NAME%-dev" >nul 2>&1
if %errorlevel% equ 0 (
    echo Development: running
    curl -s http://localhost:5173 >nul 2>&1
    if %errorlevel% equ 0 (
        echo   Dev server: accessible
    ) else (
        echo   Dev server: not accessible
    )
) else (
    echo Development container not running
)
goto end

:status
echo.
echo Container Status:
echo.
docker ps -a --filter "name=%PROJECT_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo Images:
docker images --filter "reference=%PROJECT_NAME%" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo.
goto end

:end
endlocal
