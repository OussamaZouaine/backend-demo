pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = 1
        PATH = "${env.HOME}/.bun/bin:${env.PATH}"
        IMAGE_NAME = 'backend-demo'
        SONARQUBE_INSTALLATION = 'sonar-qube'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'checking out the source code from the repository...'
                checkout scm
            }
        }

        stage('Setup Bun') { // setup bun, this is a custom step
            steps {
                sh 'curl -fsSL https://bun.sh/install | bash'
            }
        }

        stage('Install Dependencies') { // install the dependencies, this is a custom step
            steps {
                sh 'bun install --frozen-lockfile'
            }
        }

        // Server URL + token: Jenkins → Configure System → SonarQube servers (name = SONARQUBE_INSTALLATION). Scanner: bun run sonar (sonar-project.properties).
        // Quality Gate: enable webhook on that server; SonarQube must POST to Jenkins (Administration → Webhooks).
        stage('SonarQube analysis') {
            steps {
                withSonarQubeEnv("${env.SONARQUBE_INSTALLATION}") {
                    sh """
                        set -e
                        if [ -z "\${SONAR_HOST_URL:-}" ]; then
                          echo "ERROR: SONAR_HOST_URL is empty. Add SonarQube server '${env.SONARQUBE_INSTALLATION}' under Configure System with a URL this agent can reach."
                          exit 1
                        fi
                        bun run sonar -- \\
                          -Dsonar.host.url="\${SONAR_HOST_URL}" \\
                          -Dsonar.token="\${SONAR_AUTH_TOKEN:-}" \\
                          -Dsonar.links.ci=${env.BUILD_URL}
                    """
                }
            }
        }

        // stage('Quality Gate') {
        //     steps {
        //         withSonarQubeEnv("${env.SONARQUBE_INSTALLATION}") {
        //             timeout(time: 5, unit: 'MINUTES') {
        //                 waitForQualityGate abortPipeline: true
        //             }
        //         }
        //     }
        // }

        stage('Build Application') {
            steps {
                echo '🏗️ building the application...'
                sh 'bun build --compile --minify-whitespace --minify-syntax --outfile server src/index.ts'
            }
        }


        stage('Build Docker Image') {
            steps {
                echo '🏗️ building the docker image...'
                script {
                    def branch = (env.BRANCH_NAME ?: 'unknown').replaceAll('/', '-')
                    def commit = (env.GIT_COMMIT ?: 'nocommit').take(7)
                    env.IMAGE_TAG = "${branch}-${commit}"
                    // latest: only on default branch so registry :latest always matches the newest main/master build
                    env.PUSH_LATEST = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') ? 'true' : 'false'
                    if (env.PUSH_LATEST == 'true') {
                        sh "docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest ."
                    } else {
                        sh "docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} ."
                    }
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-login', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    echo '🔑 logging in to docker hub...'
                    sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-login', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    script {
                        def fullImage = "${env.DOCKER_USERNAME}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                        sh "docker tag ${env.IMAGE_NAME}:${env.IMAGE_TAG} ${fullImage}"
                        sh "docker push ${fullImage}"
                        if (env.PUSH_LATEST == 'true') {
                            def fullLatest = "${env.DOCKER_USERNAME}/${env.IMAGE_NAME}:latest"
                            sh "docker tag ${env.IMAGE_NAME}:latest ${fullLatest}"
                            sh "docker push ${fullLatest}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo '🧹 cleaning up the workspace...'
            deleteDir()
        }
        success {
            echo '✅ build successful...'
            slackSend(
                color: 'good',
                message: "✅ *${env.JOB_NAME}* #${env.BUILD_NUMBER} succeeded — <${env.BUILD_URL}|Open build>"
            )
        }
        failure {
            echo '❌ build failed...'
            slackSend(
                color: 'danger',
                message: "❌ *${env.JOB_NAME}* #${env.BUILD_NUMBER} failed — <${env.BUILD_URL}|Open build>"
            )
        }
        unstable {
            slackSend(
                color: 'warning',
                message: "⚠️ *${env.JOB_NAME}* #${env.BUILD_NUMBER} unstable — <${env.BUILD_URL}|Open build>"
            )
        }
    }
}